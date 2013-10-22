global.useBluebird = true;
global.useQ = false;
var bluebird = require('bluebird');

var redis = require('redis');

var cl = redis.createClient();

var async = require('async');

var getfn = function(id, cb) {
    return cl.get(id, cb);
}

module.exports = function upload(stream, idOrPath, tag, done) {   
    async.waterfall([
        function(done) { getfn('bench-'+ (stream&255), done); }, 
        getfn,
        getfn,
        getfn,
        getfn
    ], done);
}

module.exports.end = function() {
    cl.end();
}

