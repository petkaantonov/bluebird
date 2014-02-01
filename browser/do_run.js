var runner = mocha.run();
runner.on('end', function() {
    var stats = runner.stats;
    //Saucelabs idiosyncrasy
    stats.failures = stats.tests - stats.passes;
    window.mochaResults = runner.stats;
});

var lastTests = 0;
setInterval(function(){
    var tests = runner.stats.tests;
    if (!window.mochaResults && tests === lastTests) {
        var stats = runner.stats;
        //Saucelabs idiosyncrasy
        stats.failures = stats.tests - stats.passes;
        window.mochaResults = runner.stats;
    }
    lastTests = tests;
}, 2000);
