var runner = mocha.run();
//Saucelabs idiosyncrasy
runner.on('end', function() {
  window.mochaResults = runner.stats;
});
