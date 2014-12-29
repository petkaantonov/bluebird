var Promise = require("../js/debug/bluebird.js");
window.Promise = Promise;
window.adapter = Promise;
window.sinon = require("sinon");
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

require('../test/mocha/2.1.2.js');
require('../test/mocha/2.1.3.js');
require('../test/mocha/2.2.1.js');
require('../test/mocha/2.2.2.js');
require('../test/mocha/2.2.3.js');
require('../test/mocha/2.2.4.js');
require('../test/mocha/2.2.5.js');
require('../test/mocha/2.2.6.js');
require('../test/mocha/2.2.7.js');
require('../test/mocha/2.3.1.js');
require('../test/mocha/2.3.2.js');
if (haveGetters) require('../test/mocha/2.3.3.js');
require('../test/mocha/2.3.4.js');
require('../test/mocha/3.2.1.js');
require('../test/mocha/3.2.2.js');
require('../test/mocha/3.2.3.js');
require('../test/mocha/3.2.4.js');
require('../test/mocha/3.2.5.js');
require('../test/mocha/3.2.6.js');
require('../test/mocha/api_exceptions.js');
require('../test/mocha/async.js');
require('../test/mocha/bind.js');
require('../test/mocha/bluebird-multiple-instances.js');
require('../test/mocha/call.js');
require('../test/mocha/cancel.js');
require('../test/mocha/catch_filter.js');
require('../test/mocha/collections_thenables.js');
require('../test/mocha/constructor.js');
require('../test/mocha/cycles.js');
require('../test/mocha/direct_resolving.js');
require('../test/mocha/domain.js');
require('../test/mocha/each.js');
require('../test/mocha/error.js');
require('../test/mocha/filter.js');
require('../test/mocha/following.js');
require('../test/mocha/get.js');
require('../test/mocha/github-2xx-76.js');
require('../test/mocha/github-3.6.4.js');
require('../test/mocha/github-3.7.3.js');
require('../test/mocha/github36.js');
require('../test/mocha/late_buffer_safety.js');
require('../test/mocha/method.js');
require('../test/mocha/promisify.js');
require('../test/mocha/props.js');
require('../test/mocha/q_all.js');
require('../test/mocha/q_done.js');
require('../test/mocha/q_fin.js');
require('../test/mocha/q_inspect.js');
require('../test/mocha/q_make_node_resolver.js');
require('../test/mocha/q_nodeify.js');
require('../test/mocha/q_progress.js');
require('../test/mocha/q_propagation.js');
require('../test/mocha/q_settle.js');
require('../test/mocha/q_spread.js');
require('../test/mocha/race.js');
require('../test/mocha/reduce.js');
require('../test/mocha/reflect.js');
require('../test/mocha/resolution.js');
require('../test/mocha/reused_promise.js');
require('../test/mocha/schedule.js');
require('../test/mocha/some.js');
require('../test/mocha/tap.js');
require('../test/mocha/timers.js');
require('../test/mocha/try.js');
require('../test/mocha/unhandled_rejections.js');
require('../test/mocha/using.js');
require('../test/mocha/when_all.js');
require('../test/mocha/when_any.js');
require('../test/mocha/when_defer.js');
require('../test/mocha/when_join.js');
require('../test/mocha/when_map.js');
require('../test/mocha/when_reduce.js');
require('../test/mocha/when_settle.js');
require('../test/mocha/when_some.js');
require('../test/mocha/when_spread.js');
require('../test/mocha/rejections.js');
require('../test/mocha/regress.js');


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
