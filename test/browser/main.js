var Promise = require("../../js/debug/bluebird.js");
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

require('../mocha/2.1.2.js');
require('../mocha/2.1.3.js');
require('../mocha/2.2.1.js');
require('../mocha/2.2.2.js');
require('../mocha/2.2.3.js');
require('../mocha/2.2.4.js');
require('../mocha/2.2.5.js');
require('../mocha/2.2.6.js');
require('../mocha/2.2.7.js');
require('../mocha/2.3.1.js');
require('../mocha/2.3.2.js');
if (haveGetters) require('../mocha/2.3.3.js');
require('../mocha/2.3.4.js');
require('../mocha/3.2.1.js');
require('../mocha/3.2.2.js');
require('../mocha/3.2.3.js');
require('../mocha/3.2.4.js');
require('../mocha/3.2.5.js');
require('../mocha/3.2.6.js');
require('../mocha/api_exceptions.js');
require('../mocha/async.js');
require('../mocha/bind.js');
require('../mocha/bluebird-multiple-instances.js');
require('../mocha/call.js');
require('../mocha/cancel.js');
require('../mocha/catch_filter.js');
require('../mocha/collections_thenables.js');
require('../mocha/constructor.js');
require('../mocha/cycles.js');
require('../mocha/direct_resolving.js');
require('../mocha/domain.js');
require('../mocha/each.js');
require('../mocha/error.js');
require('../mocha/filter.js');
require('../mocha/following.js');
require('../mocha/get.js');
require('../mocha/github-2xx-76.js');
require('../mocha/github-3.6.4.js');
require('../mocha/github-3.7.3.js');
require('../mocha/github36.js');
require('../mocha/late_buffer_safety.js');
require('../mocha/method.js');
require('../mocha/promisify.js');
require('../mocha/props.js');
require('../mocha/q_all.js');
require('../mocha/q_done.js');
require('../mocha/q_fin.js');
require('../mocha/q_inspect.js');
require('../mocha/q_make_node_resolver.js');
require('../mocha/q_nodeify.js');
require('../mocha/q_progress.js');
require('../mocha/q_propagation.js');
require('../mocha/q_settle.js');
require('../mocha/q_spread.js');
require('../mocha/race.js');
require('../mocha/reduce.js');
require('../mocha/reflect.js');
require('../mocha/resolution.js');
require('../mocha/reused_promise.js');
require('../mocha/schedule.js');
require('../mocha/some.js');
require('../mocha/tap.js');
require('../mocha/timers.js');
require('../mocha/try.js');
require('../mocha/unhandled_rejections.js');
require('../mocha/using.js');
require('../mocha/when_all.js');
require('../mocha/when_any.js');
require('../mocha/when_defer.js');
require('../mocha/when_join.js');
require('../mocha/when_map.js');
require('../mocha/when_reduce.js');
require('../mocha/when_settle.js');
require('../mocha/when_some.js');
require('../mocha/when_spread.js');
require('../mocha/rejections.js');
require('../mocha/regress.js');


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
