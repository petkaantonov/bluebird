var runner = mocha.run();
runner.on('end', function() {
    //Saucelabs idiosyncrasy
    window.mochaResults = runner.stats
});
