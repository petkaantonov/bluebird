var Promise = require("../../js/browser/bluebird.min.js");
Promise.longStackTraces();
Promise.config({cancellation:true});
self.Promise = Promise;
self.adapter = Promise;
