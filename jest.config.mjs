import { createJsWithTsPreset } from 'ts-jest';

/** @type {import('jest').Config} **/
const cfg = {
    testEnvironment: 'node',
    ...createJsWithTsPreset(),
};
export default cfg;
