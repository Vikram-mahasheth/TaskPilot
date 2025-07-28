export default {
    testEnvironment: 'node',
    transform: {}, // Needed for ES Modules
    setupFilesAfterEnv: ['./tests/setup.js'], // Setup file for db connection
    testTimeout: 30000, // Increase timeout for db setup
};