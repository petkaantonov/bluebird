global.useQ = true;

var q = require('q');

var redis = require('redis');

var cl = redis.createClient();

/*
for (var k = 0; k < 512; ++k) {
    cl.set('bench-'+k, 'some value contained');
}
*/

cl.getAsync = q.nbind(cl.get, cl);



module.exports = function upload(stream, idOrPath, tag, done) {
    cl.getAsync('bench-'+(stream & 511)).nodeify(done);
}

module.exports.end = function() {
    cl.end();
}

