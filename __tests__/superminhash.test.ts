import { SuperMinHash, HashableElement } from '../src/superminhash';

describe('SuperMinHash', () => {
    describe('constructor', () => {
        it('should create a new instance with default values', () => {
            const minhash = new SuperMinHash();
            expect(minhash.signatureSize).toBe(SuperMinHash.DEFAULT_SIGNATURE_SIZE);
            expect(minhash.isEmpty()).toBe(true);
        });

        it('should create a new instance with custom signature size', () => {
            const minhash = new SuperMinHash(256);
            expect(minhash.signatureSize).toBe(256);
            expect(minhash.isEmpty()).toBe(true);
        });

        it('should create a new instance with custom seed', () => {
            const minhash = new SuperMinHash(128, 123);
            expect(minhash.signatureSize).toBe(128);
            expect(minhash.isEmpty()).toBe(true);
        });

        it('should throw error for negative signature size', () => {
            expect(() => new SuperMinHash(-1)).toThrow('Signature size must be a positive integer');
        });

        it('should throw error for zero signature size', () => {
            expect(() => new SuperMinHash(0)).toThrow('Signature size must be a positive integer');
        });

        it('should throw error for non-integer signature size', () => {
            expect(() => new SuperMinHash(12.5)).toThrow('Signature size must be a positive integer');
        });
    });

    describe('add', () => {
        it('should add string elements to the signature', () => {
            const minhash = new SuperMinHash();
            const elements = ['a', 'b', 'c'];
            minhash.add(elements);
            expect(minhash.isEmpty()).toBe(false);
        });

        it('should add number elements to the signature', () => {
            const minhash = new SuperMinHash();
            const elements = [1, 2, 3];
            minhash.add(elements);
            expect(minhash.isEmpty()).toBe(false);
        });

        it('should add boolean elements to the signature', () => {
            const minhash = new SuperMinHash();
            const elements = [true, false];
            minhash.add(elements);
            expect(minhash.isEmpty()).toBe(false);
        });

        it('should add object elements to the signature', () => {
            const minhash = new SuperMinHash();
            const elements = [{ a: 1 }, { b: 2 }];
            minhash.add(elements);
            expect(minhash.isEmpty()).toBe(false);
        });

        it('should add nested object elements to the signature', () => {
            const minhash = new SuperMinHash();
            const elements = [{ a: { b: { c: 1 } } }];
            minhash.add(elements);
            expect(minhash.isEmpty()).toBe(false);
        });

        it('should add array elements to the signature', () => {
            const minhash = new SuperMinHash();
            const elements = [
                [1, 2],
                [3, 4],
            ];
            minhash.add(elements);
            expect(minhash.isEmpty()).toBe(false);
        });

        it('should handle adding elements from a Set', () => {
            const minhash = new SuperMinHash();
            const elements = new Set(['a', 'b', 'c']);
            minhash.add(elements);
            expect(minhash.isEmpty()).toBe(false);
        });

        it('should throw error for input exceeding maximum length', () => {
            const minhash = new SuperMinHash();
            const longString = 'a'.repeat(100001);
            expect(() => minhash.add([longString])).toThrow(/Input exceeds maximum length/);
        });

        it('should process each element independently', () => {
            const minhash1 = new SuperMinHash(128, 42);
            minhash1.add(['a', 'b']);

            const minhash2 = new SuperMinHash(128, 42);
            minhash2.add(['a']);
            minhash2.add(['b']);

            expect(minhash1.getSignature()).toEqual(minhash2.getSignature());
        });
    });

    describe('similarity', () => {
        it('should return 1.0 for identical signatures', () => {
            const minhash1 = new SuperMinHash();
            const minhash2 = new SuperMinHash();
            const elements = ['a', 'b', 'c'];

            minhash1.add(elements);
            minhash2.add(elements);

            expect(minhash1.similarity(minhash2)).toBe(1.0);
        });

        it('should return 0.0 for completely different signatures', () => {
            const minhash1 = new SuperMinHash(128, 42);
            const minhash2 = new SuperMinHash(128, 42);

            minhash1.add(['a', 'b', 'c']);
            minhash2.add(['d', 'e', 'f']);

            const similarity = minhash1.similarity(minhash2);
            expect(similarity).toBeLessThan(0.1);
        });

        it('should return approximate Jaccard similarity for partially overlapping sets', () => {
            const minhash1 = new SuperMinHash(1024, 42);
            const minhash2 = new SuperMinHash(1024, 42);

            const set1 = Array.from({ length: 100 }, (_, i) => `element${i}`);
            const set2 = Array.from({ length: 100 }, (_, i) => `element${i + 50}`);

            minhash1.add(set1);
            minhash2.add(set2);

            const similarity = minhash1.similarity(minhash2);

            expect(similarity).toBeGreaterThan(0.2);
            expect(similarity).toBeLessThan(0.5);
        });

        it('should return 1.0 for empty signatures', () => {
            const minhash1 = new SuperMinHash();
            const minhash2 = new SuperMinHash();
            expect(minhash1.similarity(minhash2)).toBe(1.0);
        });

        it('should return 0.0 when one signature is empty', () => {
            const minhash1 = new SuperMinHash();
            const minhash2 = new SuperMinHash();
            minhash1.add(['a', 'b', 'c']);
            expect(minhash1.similarity(minhash2)).toBe(0.0);
            expect(minhash2.similarity(minhash1)).toBe(0.0);
        });

        it('should throw error when comparing signatures with different seeds', () => {
            const minhash1 = new SuperMinHash(128, 42);
            const minhash2 = new SuperMinHash(128, 43);
            minhash1.add(['a']);
            minhash2.add(['a']);
            expect(() => minhash1.similarity(minhash2)).toThrow(
                'Cannot compare signatures generated with different seeds',
            );
        });

        it('should throw error when comparing signatures with different sizes', () => {
            const minhash1 = new SuperMinHash(128);
            const minhash2 = new SuperMinHash(256);
            minhash1.add(['a']);
            minhash2.add(['a']);
            expect(() => minhash1.similarity(minhash2)).toThrow('Can only compare signatures of the same size');
        });
    });

    describe('getJaccardIndex', () => {
        it('should calculate Jaccard index correctly', () => {
            const minhash1 = new SuperMinHash();
            const minhash2 = new SuperMinHash();

            minhash1.add(['a', 'b']);
            minhash2.add(['b', 'c']);

            const similarity = minhash1.getJaccardIndex(minhash2);
            expect(similarity).toBeGreaterThanOrEqual(0);
            expect(similarity).toBeLessThanOrEqual(1);
        });

        it('should throw error when comparing signatures with different seeds', () => {
            const minhash1 = new SuperMinHash(128, 42);
            const minhash2 = new SuperMinHash(128, 43);
            expect(() => minhash1.getJaccardIndex(minhash2)).toThrow(
                'Cannot compare signatures generated with different seeds',
            );
        });

        it('should throw error when comparing signatures with different sizes', () => {
            const minhash1 = new SuperMinHash(128);
            const minhash2 = new SuperMinHash(256);
            expect(() => minhash1.getJaccardIndex(minhash2)).toThrow('Can only compare signatures of the same size');
        });
    });

    describe('serialize and deserialize', () => {
        it('should correctly serialize and deserialize an empty signature', () => {
            const original = new SuperMinHash(128, 42);
            const binary = original.serialize();
            const deserialized = SuperMinHash.deserialize(binary);

            expect(deserialized.signatureSize).toBe(original.signatureSize);
            expect(deserialized.isEmpty()).toBe(original.isEmpty());
            expect(Array.from(deserialized.getSignature())).toEqual(Array.from(original.getSignature()));
        });

        it('should correctly serialize and deserialize a non-empty signature', () => {
            const original = new SuperMinHash(128, 42);
            original.add(['a', 'b', 'c']);
            const binary = original.serialize();
            const deserialized = SuperMinHash.deserialize(binary);

            expect(deserialized.signatureSize).toBe(original.signatureSize);
            expect(deserialized.isEmpty()).toBe(original.isEmpty());
            expect(Array.from(deserialized.getSignature())).toEqual(Array.from(original.getSignature()));
        });

        it('should throw error when deserializing invalid binary data (too short)', () => {
            const binary = new Uint8Array(8);
            expect(() => SuperMinHash.deserialize(binary)).toThrow('Invalid binary data: too short');
        });

        it('should throw error when deserializing binary data with invalid signature size', () => {
            const buffer = new ArrayBuffer(9);
            const view = new DataView(buffer);
            view.setUint32(0, 0, true);
            const binary = new Uint8Array(buffer);
            expect(() => SuperMinHash.deserialize(binary)).toThrow(
                'Invalid binary data: signature size must be positive',
            );
        });

        it('should throw error when deserializing binary data with inconsistent length', () => {
            const buffer = new ArrayBuffer(20);
            const view = new DataView(buffer);
            view.setUint32(0, 10, true);
            const binary = new Uint8Array(buffer);
            expect(() => SuperMinHash.deserialize(binary)).toThrow('Invalid binary data: expected length');
        });
    });

    describe('compareSerialized', () => {
        it('should correctly compare two serialized signatures', () => {
            const minhash1 = new SuperMinHash(128, 42);
            const minhash2 = new SuperMinHash(128, 42);

            minhash1.add(['a', 'b', 'c']);
            minhash2.add(['a', 'b', 'c']);

            const binary1 = minhash1.serialize();
            const binary2 = minhash2.serialize();

            const similarity = SuperMinHash.compareSerialized(binary1, binary2);
            expect(similarity).toBe(1.0);
        });
    });

    describe('fromRawSignature', () => {
        it('should create a SuperMinHash from a raw signature', () => {
            const signature = new Uint32Array(128).fill(SuperMinHash['MAX_HASH_VALUE']);
            const seed = 42;
            const minhash = SuperMinHash.fromRawSignature(signature, seed);

            expect(minhash.signatureSize).toBe(128);
            expect(minhash.isEmpty()).toBe(false);
            expect(Array.from(minhash.getSignature())).toEqual(Array.from(signature));
        });
    });

    describe('fromIterable', () => {
        it('should create a SuperMinHash from an iterable', () => {
            const elements = ['a', 'b', 'c'];
            const minhash = SuperMinHash.fromIterable(elements);

            expect(minhash.signatureSize).toBe(SuperMinHash.DEFAULT_SIGNATURE_SIZE);
            expect(minhash.isEmpty()).toBe(false);
        });

        it('should create a SuperMinHash from an iterable with custom signature size and seed', () => {
            const elements = ['a', 'b', 'c'];
            const minhash = SuperMinHash.fromIterable(elements, 256, 123);

            expect(minhash.signatureSize).toBe(256);
            expect(minhash.isEmpty()).toBe(false);
        });
    });

    describe('internal operations', () => {
        it('should handle small signature sizes correctly', () => {
            const minhash = new SuperMinHash(10, 42);
            minhash.add(['a', 'b', 'c']);
            expect(minhash.isEmpty()).toBe(false);
            expect(minhash.getSignature().length).toBe(10);
        });

        it('should handle large signature sizes efficiently', () => {
            const minhash = new SuperMinHash(512, 42);
            minhash.add(['a', 'b', 'c']);
            expect(minhash.isEmpty()).toBe(false);
            expect(minhash.getSignature().length).toBe(512);
        });

        it('should adjust maxBucketIndex when buckets become empty', () => {
            const minhash = new SuperMinHash(5, 12345);

            for (let i = 0; i < 20; i++) {
                minhash.add([`element-${i}`]);
            }

            expect(minhash.isEmpty()).toBe(false);

            const signature = minhash.getSignature();

            const populatedValues = Array.from(signature).filter((v) => v !== 0xffffffff);
            expect(populatedValues.length).toBeGreaterThan(0);
        });

        it('should process all element types correctly', () => {
            const minhash = new SuperMinHash();
            const elements: HashableElement[] = ['string', 123, true, { a: 1, b: '2', c: true }, [1, '2', false]];
            minhash.add(elements);
            expect(minhash.isEmpty()).toBe(false);
        });

        it('should handle adding multiple times to the same instance', () => {
            const minhash = new SuperMinHash();
            minhash.add(['a', 'b']);
            const sig1 = minhash.getSignature();
            minhash.add(['c', 'd']);
            const sig2 = minhash.getSignature();

            expect(Array.from(sig1)).not.toEqual(Array.from(sig2));
        });

        it('should update maxBucketIndex correctly', () => {
            const minhash = new SuperMinHash(10, 42);
            minhash.add(['a']);
            minhash.add(['b']);
            minhash.add(['c']);
            expect(minhash.isEmpty()).toBe(false);
        });

        it('should decrement maxBucketIndex when upper buckets become empty', () => {
            const minhash = new SuperMinHash(3, 42);

            const testFunction = () => {
                // @ts-ignore - Accessing private property for testing
                const bucketCounts = [0, 0, 3];
                // @ts-ignore - Accessing private method for testing
                const result = minhash['adjustMaxBucketIndex'](2, bucketCounts);

                expect(result).toBe(2);

                bucketCounts[2] = 0;
                // @ts-ignore - Accessing private method for testing
                const newResult = minhash['adjustMaxBucketIndex'](2, bucketCounts);

                expect(newResult).toBe(0);
            };

            testFunction();
        });

        it('should handle extremely similar but not identical sets', () => {
            const minhash1 = new SuperMinHash(1024, 42);
            const minhash2 = new SuperMinHash(1024, 42);

            const set1 = Array.from({ length: 1000 }, (_, i) => `element${i}`);
            const set2 = [...set1];
            set2[999] = 'different';

            minhash1.add(set1);
            minhash2.add(set2);

            const similarity = minhash1.similarity(minhash2);
            expect(similarity).toBeGreaterThan(0.95);
        });
    });
});
