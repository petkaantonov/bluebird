var Promise = require("../../js/instrumented/bluebird.js");
window.Promise = Promise;
window.adapter = Promise;
Promise.config({cancellation:true});
