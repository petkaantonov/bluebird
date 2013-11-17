module.exports = {
  tests: {
    src: ['test/test-adapter.js',
          'node_modules/promises-aplus-tests/node_modules/sinon/lib/{sinon.js,sinon/*.js}',
          'node_modules/promises-aplus-tests/lib/tests/**/*.js'],
    dest: 'tmp/tests-bundle.js'
  }
};
