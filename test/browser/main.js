var Promise = require("../../js/debug/bluebird.js");
window.Promise = Promise;
window.adapter = Promise;
window.assert = require("assert");

var prev = window.assert.deepEqual;
window.assert.deepEqual = function(a, b) {
    if (Array.isArray(a) &&
        Array.isArray(b)) {
        if (a.length === b.length) {
            for (var i = 0; i < a.length; ++i) {
                if (a[i] !== b[i]) {
                    return false;
                }
            }
            return true;
        }
        return false;
    } else {
        return prev.call(window.assert, a, b);
    }
};

window.setImmediate = function(fn){
    setTimeout(fn, 0);
};

window.onload = function(){
    var runner = mocha.run();

    var failedTests = [];
    runner.on('end', function(){
      window.mochaResults = runner.stats;
      window.mochaResults.reports = failedTests;
    });

    runner.on('fail', logFailure);

    function logFailure(test, err) {

      var flattenTitles = function(test){
        var titles = [];
        while (test.parent.title){
          titles.push(test.parent.title);
          test = test.parent;
        }
        return titles.reverse();
      };

      failedTests.push({name: test.title, result: false, message: err.message, stack: err.stack, titles: flattenTitles(test) });
    }
};
