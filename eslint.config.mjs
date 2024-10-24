import pluginJs from '@eslint/js';
import esLintImport from 'eslint-plugin-import';
import esLintJest from 'eslint-plugin-jest';
import esLintNode from 'eslint-plugin-n';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tsEsLint from 'typescript-eslint';

/** @type {import('@typescript-eslint/utils').ConfigArray} */
export default [
    {
        ignores: ['dist/**'],
    },
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    },
    {
        languageOptions: {
            globals: globals.node,
            parserOptions: {
                allowDefaultProject: true,
                projectService: {
                    defaultProject: './tsconfig.json',
                    loadTypeScriptPlugins: false,
                },
                project: './tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    pluginJs.configs.recommended,
    {
        ...esLintImport.flatConfigs.recommended,
        rules: {
            ...esLintImport.flatConfigs.recommended.rules,
            'imports/order': ['off'],
            'import/first': ['error'],
            'import/newline-after-import': ['error'],
            'import/no-namespace': ['error'],
            'import/consistent-type-specifier-style': [
                'error',
                'prefer-inline',
            ],
        },
        settings: {
            ...esLintImport.flatConfigs.recommended.settings,
            'import/parsers': {
                '@typescript-eslint/parser': ['.ts', '.tsx', '.cts', '.mts'],
            },
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: false,
                },
                node: true,
            },
        },
    },
    {
        plugins: {
            'simple-import-sort': simpleImportSort,
        },
        rules: {
            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'error',
        },
    },
    {
        ...unicorn.configs['flat/recommended'],
        rules: {
            ...unicorn.configs['flat/recommended'].rules,
            'unicorn/consistent-destructuring': ['error'],
        },
    },
    {
        ...esLintNode.configs['flat/recommended'],
        rules: {
            ...esLintNode.configs['flat/recommended'].rules,
            'n/no-missing-import': 'off',
            'n/exports-style': ['error'],
            'n/prefer-node-protocol': ['error'],
            'n/prefer-global/url': ['error'],
            'n/prefer-global/console': ['error'],
            'n/prefer-global/process': ['error', 'never'],
            'n/prefer-global/buffer': ['error', 'never'],
        },
        settings: {
            ...esLintNode.configs['flat/recommended'].settings,
            tsconfigPath: './tsconfig.json',
        },
    },
    ...tsEsLint.configs.recommendedTypeChecked,
    ...tsEsLint.configs.stylisticTypeChecked,
    {
        files: ['test/**/*.test.ts'],
        ...esLintJest.configs['flat/all'],
    },
    {
        files: ['**/*.{js,mjs,cjs}'],
        ...tsEsLint.configs.disableTypeChecked,
        rules: {
            ...tsEsLint.configs.disableTypeChecked.rules,
            'jest/unbound-method': 'off',
        },
    },
];
