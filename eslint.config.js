import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            curly: ['error', 'all'],
            '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
            '@typescript-eslint/no-confusing-void-expression': 'off',
            '@typescript-eslint/no-unsafe-call': 'off', // for testing
            '@typescript-eslint/no-unsafe-member-access': 'off', // for testing
            '@typescript-eslint/no-unsafe-assignment': 'off', // for testing
            '@typescript-eslint/no-non-null-assertion': 'off', // for testing
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/restrict-template-expressions': 'off',
            '@typescript-eslint/no-extraneous-class': 'off',
        },
    },
    {
        ignores: ['.jest/', 'coverage/', 'public/', 'node_modules/', 'dist/', '*.config.js', '__tests__/'],
    },
);
