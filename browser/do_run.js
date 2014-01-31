var runner = mocha.run();
runner.on('end', function() {
    //Saucelabs idiosyncrasy
    window.mochaResults = {
        suites: runner.suite.suites.length,
        tests: runner.total,
        passes: runner.total - runner.failures,
        failures: runner.failures,
        pending: 0
    };
});
