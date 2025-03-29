import seedrandom from 'seedrandom';

export type HashableElement = unknown;

type ElementProcessingContext = {
    positions: number[];
    processedElements: number[];
    bucketCounts: number[];
    maxBucketIndex: number;
};

export class SuperMinHash {
    public static readonly DEFAULT_SIGNATURE_SIZE = 256;
    public static readonly DEFAULT_SEED = 42;

    private readonly signature: Uint32Array;
    private empty = true;

    private static readonly MAX_INPUT_LENGTH = 100000;
    private static readonly MAX_HASH_VALUE = 0xffffffff;

    constructor(
        public readonly signatureSize: number = SuperMinHash.DEFAULT_SIGNATURE_SIZE,
        private readonly seed = SuperMinHash.DEFAULT_SEED,
    ) {
        if (this.signatureSize <= 0 || !Number.isInteger(this.signatureSize)) {
            throw new Error('Signature size must be a positive integer');
        }

        this.signature = new Uint32Array(this.signatureSize).fill(SuperMinHash.MAX_HASH_VALUE);
        this.empty = true;
    }

    private generateSeedString(element: HashableElement): string {
        const serialized = typeof element === 'string' ? element : JSON.stringify(element);

        if (serialized.length > SuperMinHash.MAX_INPUT_LENGTH) {
            throw new Error(`Input exceeds maximum length of ${SuperMinHash.MAX_INPUT_LENGTH} characters`);
        }

        return `${this.seed}:${serialized}`;
    }

    public add(elements: Iterable<HashableElement>): void {
        const emptyContext = this.initProcessingContext();
        for (const element of elements) {
            this.empty = false;
            const elementSeedString = this.generateSeedString(element);
            const randomGenerator = seedrandom(elementSeedString);

            const processingContext = this.cloneProcessingContext(emptyContext);
            this.processElementWithContext(processingContext, randomGenerator);
        }
    }

    private initProcessingContext(): ElementProcessingContext {
        const m = this.signatureSize;
        return {
            positions: Array.from({ length: m }, (_, i) => i),
            processedElements: new Array(m).fill(-1),
            bucketCounts: [...new Array(m - 1).fill(0), m],
            maxBucketIndex: m - 1,
        };
    }

    private cloneProcessingContext(context: ElementProcessingContext): ElementProcessingContext {
        return {
            positions: [...context.positions],
            processedElements: [...context.processedElements],
            bucketCounts: [...context.bucketCounts],
            maxBucketIndex: context.maxBucketIndex,
        };
    }

    private processElementWithContext(context: ElementProcessingContext, randomGenerator: seedrandom.PRNG): void {
        const { positions, processedElements, bucketCounts } = context;
        let { maxBucketIndex } = context;

        let currentPosition = 0;
        while (currentPosition <= maxBucketIndex) {
            const randomValue = Math.floor(randomGenerator() * SuperMinHash.MAX_HASH_VALUE);
            const randomPosition = this.selectRandomPosition(currentPosition, this.signatureSize, randomGenerator);

            this.ensurePositionsInitialized(currentPosition, randomPosition, positions, processedElements);
            this.swapPositions(currentPosition, randomPosition, positions);

            const signaturePosition = positions[currentPosition];
            maxBucketIndex = this.updateSignatureIfNeeded(
                currentPosition,
                randomValue,
                signaturePosition,
                bucketCounts,
                maxBucketIndex,
            );

            currentPosition++;
        }
    }

    private selectRandomPosition(currentPosition: number, size: number, randomGenerator: seedrandom.PRNG): number {
        return currentPosition + Math.floor(randomGenerator() * (size - currentPosition));
    }

    private ensurePositionsInitialized(
        pos1: number,
        pos2: number,
        positions: number[],
        processedElements: number[],
    ): void {
        if (processedElements[pos1] !== 0) {
            processedElements[pos1] = 0;
            positions[pos1] = pos1;
        }

        if (processedElements[pos2] !== 0) {
            processedElements[pos2] = 0;
            positions[pos2] = pos2;
        }
    }

    private swapPositions(pos1: number, pos2: number, positions: number[]): void {
        const temp = positions[pos1];
        positions[pos1] = positions[pos2];
        positions[pos2] = temp;
    }

    private updateSignatureIfNeeded(
        currentPosition: number,
        randomValue: number,
        signaturePosition: number,
        bucketCounts: number[],
        maxBucketIndex: number,
    ): number {
        const newValue = (randomValue + currentPosition) % SuperMinHash.MAX_HASH_VALUE;
        const currentValue = this.signature[signaturePosition];

        if (newValue < currentValue) {
            const previousBucket = Math.min(currentValue, this.signatureSize - 1);
            this.signature[signaturePosition] = newValue;

            if (currentPosition < previousBucket) {
                bucketCounts[previousBucket]--;
                bucketCounts[currentPosition]++;

                return this.adjustMaxBucketIndex(maxBucketIndex, bucketCounts);
            }
        }

        return maxBucketIndex;
    }

    private adjustMaxBucketIndex(currentMax: number, bucketCounts: number[]): number {
        let newMax = currentMax;
        while (newMax > 0 && bucketCounts[newMax] === 0) {
            newMax--;
        }
        return newMax;
    }

    public similarity(other: SuperMinHash): number {
        if (this.empty || other.empty) {
            return this.empty && other.empty ? 1.0 : 0.0;
        }

        return this.getJaccardIndex(other);
    }

    public getJaccardIndex(other: SuperMinHash): number {
        if (this.seed !== other.seed) {
            throw new Error('Cannot compare signatures generated with different seeds');
        }

        if (this.signatureSize !== other.signatureSize) {
            throw new Error('Can only compare signatures of the same size');
        }

        return (
            this.signature.reduce((acc, value, index) => {
                return acc + (value === other.signature[index] ? 1 : 0);
            }, 0) / this.signatureSize
        );
    }

    public getSignature(): Uint32Array {
        return new Uint32Array(this.signature);
    }

    public isEmpty(): boolean {
        return this.empty;
    }

    public serialize(): Uint8Array {
        const metadataSize = 9; // 4 bytes for size, 4 for seed, 1 for empty
        const bufferSize = metadataSize + this.signatureSize * 4;
        const buffer = new ArrayBuffer(bufferSize);
        const view = new DataView(buffer);

        view.setUint32(0, this.signatureSize, true);
        view.setUint32(4, this.seed, true);
        view.setUint8(8, this.empty ? 0 : 1);

        let offset = metadataSize;
        for (let position = 0; position < this.signatureSize; position++) {
            view.setUint32(offset, this.signature[position], true);
            offset += 4;
        }

        return new Uint8Array(buffer);
    }

    public static deserialize(binary: Uint8Array): SuperMinHash {
        if (binary.length < 9) {
            throw new Error('Invalid binary data: too short');
        }

        const view = new DataView(binary.buffer);
        const signatureSize = view.getUint32(0, true);

        if (signatureSize <= 0) {
            throw new Error('Invalid binary data: signature size must be positive');
        }

        const expectedLength = 9 + signatureSize * 4;
        if (binary.length !== expectedLength) {
            throw new Error(`Invalid binary data: expected length ${expectedLength}, got ${binary.length}`);
        }

        const seed = view.getUint32(4, true);
        const empty = view.getUint8(8) === 0;

        const minhash = new SuperMinHash(signatureSize, seed);
        minhash.empty = empty;

        const metadataSize = 9;
        for (let position = 0; position < signatureSize; position++) {
            minhash.signature[position] = view.getUint32(metadataSize + position * 4, true);
        }

        return minhash;
    }

    public static compareSerialized(firstSignature: Uint8Array, secondSignature: Uint8Array): number {
        const firstMinHash = SuperMinHash.deserialize(firstSignature);
        const secondMinHash = SuperMinHash.deserialize(secondSignature);
        return firstMinHash.similarity(secondMinHash);
    }

    public static fromRawSignature(signature: Uint32Array, seed: number, empty = false): SuperMinHash {
        const minhash = new SuperMinHash(signature.length, seed);
        minhash.signature.set(signature);
        minhash.empty = empty;
        return minhash;
    }

    public static fromIterable(
        elements: Iterable<HashableElement>,
        signatureSize = SuperMinHash.DEFAULT_SIGNATURE_SIZE,
        seed = SuperMinHash.DEFAULT_SEED,
    ): SuperMinHash {
        const minhash = new SuperMinHash(signatureSize, seed);
        minhash.add(elements);
        return minhash;
    }
}
