import { SuperMinHash } from '../src/superminhash';

describe('SuperMinHash Text Corpus Similarity', () => {
    function tokenize(text: string): string[] {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter((word) => word.length > 0);
    }

    it('should find high similarity between identical documents', () => {
        const text = 'SuperMinHash is a probabilistic data structure for estimating the similarity between datasets';
        const tokens = tokenize(text);

        const minhash1 = SuperMinHash.fromIterable(tokens);
        const minhash2 = SuperMinHash.fromIterable(tokens);

        const similarity = minhash1.similarity(minhash2);
        expect(similarity).toBe(1.0);
    });

    it('should find low similarity between completely different documents', () => {
        const text1 = 'SuperMinHash is a probabilistic data structure for estimating the similarity between datasets';
        const text2 = 'The quick brown fox jumps over the lazy dog';

        const minhash1 = SuperMinHash.fromIterable(tokenize(text1));
        const minhash2 = SuperMinHash.fromIterable(tokenize(text2));

        const similarity = minhash1.similarity(minhash2);
        expect(similarity).toBeLessThan(0.3);
    });

    it('should find moderate similarity between partially overlapping documents', () => {
        const text1 = 'SuperMinHash is a probabilistic data structure for estimating the similarity between datasets';
        const text2 = 'SuperMinHash can be used for estimating the similarity between large datasets efficiently';

        const minhash1 = SuperMinHash.fromIterable(tokenize(text1));
        const minhash2 = SuperMinHash.fromIterable(tokenize(text2));

        const similarity = minhash1.similarity(minhash2);
        expect(similarity).toBeGreaterThan(0.3);
        expect(similarity).toBeLessThan(0.9);
    });

    it('should handle longer text documents', () => {
        const text1 = `
            SuperMinHash is an efficient algorithm for estimating the Jaccard similarity between sets.
            It produces a compact signature that can be used to approximate the similarity between datasets.
            This makes it useful for tasks like document similarity, duplicate detection, and clustering.
        `;

        const text2 = `
            SuperMinHash generates signatures that can be used to measure document similarity.
            It's particularly useful for tasks like duplicate detection, clustering, and nearest-neighbor search.
            The algorithm is more memory-efficient than traditional MinHash implementations.
        `;

        const minhash1 = SuperMinHash.fromIterable(tokenize(text1));
        const minhash2 = SuperMinHash.fromIterable(tokenize(text2));

        const similarity = minhash1.similarity(minhash2);
        expect(similarity).toBeGreaterThan(0.3);
    });

    it('should match actual Jaccard similarity for small datasets', () => {
        const set1 = ['a', 'b', 'c', 'd', 'e'];
        const set2 = ['c', 'd', 'e', 'f', 'g'];

        const minhash1 = SuperMinHash.fromIterable(set1, 1024);
        const minhash2 = SuperMinHash.fromIterable(set2, 1024);

        const similarity = minhash1.similarity(minhash2);

        const actualJaccard = 3 / 7;

        expect(similarity).toBeGreaterThan(actualJaccard - 0.15);
        expect(similarity).toBeLessThan(actualJaccard + 0.15);
    });

    it('should find similar documents across languages with shared terms', () => {
        const text1 = 'SuperMinHash algorithm provides efficient similarity computation for large datasets';
        const text2 =
            'El algoritmo SuperMinHash proporciona una computación de similitud eficiente para datasets grandes';

        const minhash1 = SuperMinHash.fromIterable(tokenize(text1), 512);
        const minhash2 = SuperMinHash.fromIterable(tokenize(text2), 512);

        const similarity = minhash1.similarity(minhash2);

        expect(similarity).toBeGreaterThan(0.08);
    });
});
