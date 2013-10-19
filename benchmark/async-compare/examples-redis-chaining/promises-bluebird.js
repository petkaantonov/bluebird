global.useBluebird = true;
global.useQ = false;
var bluebird = require('bluebird');

var redis = require('redis');

var cl = redis.createClient();

/*
for (var k = 0; k < 512; ++k) {
    cl.set('bench-'+k, 'bench-'+(k+1));
}
*/


bluebird.promisifyAll(cl);

module.exports = function upload(stream, idOrPath, tag, done) {
    cl.getAsync('bench-'+(stream & 255))
    .then(function(res) {
        return cl.getAsync(res);
    })
    .then(function(res) {
        return cl.getAsync(res);
    })
    .then(function(res) {
        return cl.getAsync(res);
    }).nodeify(done);
}

module.exports.end = function() {
    cl.end();
}

