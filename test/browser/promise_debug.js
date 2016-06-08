var Promise = require("../../js/browser/bluebird.min.js");
Promise.longStackTraces();
Promise.config({cancellation:true});
window.Promise = Promise;
window.adapter = Promise;
