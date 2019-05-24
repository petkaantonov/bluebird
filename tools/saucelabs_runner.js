/*

Ripped from grunt-saucelabs node module and made independent on grunt

MIT license:

Copyright (c) 2012 Parashuram

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/

module.exports = function(options) {
  var Promise = require("bluebird");
  var SauceTunnel = require('grunt-saucelabs/node_modules/sauce-tunnel/index.js');
  var TestRunner = require('grunt-saucelabs/src/TestRunner.js');

  function reportProgress(notification) {
    switch (notification.type) {
    case 'tunnelOpen':
      console.log('=> Starting Tunnel to Sauce Labs');
      break;
    case 'tunnelOpened':
      console.log('Connected to Saucelabs');
      break;
    case 'tunnelClose':
      console.log('=> Stopping Tunnel to Sauce Labs');
      break;
    case 'tunnelEvent':
      console.log(notification.text);
      break;
    case 'jobStarted':
      console.log('\n', notification.startedJobs, '/', notification.numberOfJobs, 'tests started');
      break;
    case 'jobCompleted':
      console.log('\nTested %s', notification.url);
      console.log('Platform: %s', notification.platform);

      if (notification.tunnelId && unsupportedPort(notification.url)) {
        console.log('Warning: This url might use a port that is not proxied by Sauce Connect.');
      }

      console.log('Passed: %s', notification.passed);
      console.log('Url %s', notification.jobUrl);
      break;
    case 'testCompleted':
      console.log('All tests completed with status %s', notification.passed);
      break;
    case 'retrying':
      console.log('Timed out, retrying');
      break;
    default:
      console.error('Unexpected notification type');
    }
  }

  function createTunnel(arg) {
    var tunnel;

    reportProgress({
      type: 'tunnelOpen'
    });

    tunnel = new SauceTunnel(arg.username, arg.key, arg.identifier, true, ['-P', '0'].concat(arg.tunnelArgs));

    ['write', 'writeln', 'error', 'ok', 'debug'].forEach(function (method) {
      tunnel.on('log:' + method, function (text) {
        reportProgress({
          type: 'tunnelEvent',
          verbose: false,
          method: method,
          text: text
        });
      });
      tunnel.on('verbose:' + method, function (text) {
        reportProgress({
          type: 'tunnelEvent',
          verbose: true,
          method: method,
          text: text
        });
      });
    });

    return tunnel;
  }

  function runTask(arg, framework) {
    var tunnel;

    return Promise
      .try(function () {
        var deferred;

        if (arg.tunneled) {
          deferred = Promise.defer();

          tunnel = createTunnel(arg);
          tunnel.start(function (succeeded) {
            if (!succeeded) {
              deferred.reject('Could not create tunnel to Sauce Labs');
            } else {
              reportProgress({
                type: 'tunnelOpened'
              });

              deferred.resolve();
            }
          });
          return deferred.promise;
        }
      })
      .then(function () {
        var testRunner = new TestRunner(arg, framework, reportProgress);
        return testRunner.runTests();
      })
      .finally(function () {
        var deferred;

        if (tunnel) {
          deferred = Promise.defer();

          reportProgress({
            type: 'tunnelClose'
          });

          tunnel.stop(function () {
            deferred.resolve();
          });

          return deferred.promise;
        }
      });
  }

  function unsupportedPort(url) {
    // Not all ports are proxied by Sauce Connect. List of supported ports is
    // available at https://saucelabs.com/docs/connect#localhost
    var portRegExp = /:(\d+)\//;
    var matches = portRegExp.exec(url);
    var port = matches ? parseInt(matches[1], 10) : null;
    var supportedPorts = [
        80, 443, 888, 2000, 2001, 2020, 2109, 2222, 2310, 3000, 3001, 3030,
        3210, 3333, 4000, 4001, 4040, 4321, 4502, 4503, 4567, 5000, 5001, 5050, 5555, 5432, 6000,
        6001, 6060, 6666, 6543, 7000, 7070, 7774, 7777, 8000, 8001, 8003, 8031, 8080, 8081, 8765,
        8888, 9000, 9001, 9080, 9090, 9876, 9877, 9999, 49221, 55001
      ];

    if (port) {
      return supportedPorts.indexOf(port) === -1;
    }

    return false;
  }

  var defaults = {
    username: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    tunneled: true,
    identifier: Math.floor((new Date()).getTime() / 1000 - 1230768000).toString(),
    pollInterval: 1000 * 2,
    maxPollRetries: 0,
    testname: '',
    browsers: [{}],
    tunnelArgs: [],
    sauceConfig: {},
    maxRetries: 0
  };

  var opts = {};
  options = options || {};
  Object.keys(defaults).forEach(function(key) {
    opts[key] = defaults[key];
  });
  Object.keys(options).forEach(function(key) {
    opts[key] = options[key];
  });

  return runTask(opts, "mocha");
};
