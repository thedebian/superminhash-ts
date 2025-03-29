# SuperMinHash

SuperMinHash is a probabilistic data structure for estimating the [Jaccard similarity index](https://en.wikipedia.org/wiki/Jaccard_index) between sets.

It provides a significant improvement over traditional MinHash by requiring less memory while maintaining comparable accuracy.

This is a TypeScript implementation based on the paper "[SuperMinHash – A New Minwise Hashing Algorithm for Jaccard Similarity Estimation](https://arxiv.org/pdf/1706.05698)" by Otmar Ertl.

## Installation

```bash
npm install superminhash
```

## Quick Start

```typescript
import { SuperMinHash } from 'superminhash';

// Create two sets
const set1 = ['apple', 'banana', 'orange', 'pear'];
const set2 = ['banana', 'orange', 'kiwi', 'grape'];

// Create MinHash signatures for both sets
const minhash1 = SuperMinHash.fromIterable(set1);
const minhash2 = SuperMinHash.fromIterable(set2);

// Calculate similarity (estimated Jaccard similarity)
const similarity = minhash1.similarity(minhash2);
console.log(`Similarity: ${similarity}`); // Expected ~0.3 (2/6)
```

## Usage

### Creating a SuperMinHash Instance

```typescript
// Default parameters (signature size of 128, default seed)
const minhash = new SuperMinHash();

// Custom signature size (larger = more accurate but uses more memory)
const minhash = new SuperMinHash(256);

// Custom signature size and seed
const minhash = new SuperMinHash(128, 42);

// Create directly from an iterable
const minhash = SuperMinHash.fromIterable(['a', 'b', 'c']);
```

### Adding Elements

```typescript
// Add elements as an array
minhash.add(['apple', 'banana', 'orange']);

// Add elements from a Set
const fruitSet = new Set(['apple', 'banana', 'orange']);
minhash.add(fruitSet);

// Add elements incrementally
minhash.add(['apple']);
minhash.add(['banana']);
minhash.add(['orange']);
```

### Computing Similarity

```typescript
// Compare two SuperMinHash instances
const similarity = minhash1.similarity(minhash2);

// Alternatively, use getJaccardIndex
const jaccardIndex = minhash1.getJaccardIndex(minhash2);
```

### Serialization & Deserialization

```typescript
// Serialize to a binary format (Uint8Array)
const binaryData = minhash.serialize();

// Store the binary data (e.g., in a database, file, etc.)
// ...

// Later, deserialize it back into a SuperMinHash instance
const restoredMinHash = SuperMinHash.deserialize(binaryData);

// Compare serialized signatures directly
const similarity = SuperMinHash.compareSerialized(binaryData1, binaryData2);
```

### Working with Raw Signatures

```typescript
// Get the underlying signature
const signature = minhash.getSignature(); // Returns Uint32Array

// Create a SuperMinHash from an existing signature
const newMinHash = SuperMinHash.fromRawSignature(signature, seed);
```

## Performance Tips

1. **Choose the right signature size**: Larger signatures give more accurate similarity estimates but use more memory.
   - For most applications, 128-256 elements work well
   - For higher precision, use 512-1024 elements

2. **Reuse seeds**: Always use the same seed when comparing signatures.

3. **Preprocess large inputs**: Consider preprocessing large inputs before adding them to SuperMinHash to reduce memory usage.

## License

[MIT](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
