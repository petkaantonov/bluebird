var Promise = require("../../js/browser/bluebird.min.js");
Promise.longStackTraces();
window.Promise = Promise;
window.adapter = Promise;
