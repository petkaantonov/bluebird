global.useBluebird = true;
global.useQ = false;
var bluebird = require('bluebird');

var redis = require('redis');

var cl = redis.createClient();


module.exports = function upload(stream, idOrPath, tag, done) {
    cl.get('bench-'+(stream & 511), done);
}

module.exports.end = function() {
    cl.end();
}

