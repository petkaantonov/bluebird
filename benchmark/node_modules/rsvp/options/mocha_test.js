module.exports = {
  test: {
    src: [
      'test/vendor/assert.js',
      'test/test-adapter.js',
      'node_modules/promises-aplus-tests/lib/tests/**/*.js',
      'tmp/tests.cjs.js'
    ],
    options: {
      reporter: 'spec'
    }
  }
};
