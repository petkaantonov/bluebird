global.useQ = true;

var q = require('kew');

var redis = require('redis');

var cl = redis.createClient();

/*
for (var k = 0; k < 512; ++k) {
    cl.set('bench-'+k, 'some value contained');
}
*/

function bind(fn, ctx) {
    return function(a1, a2, a3, a4) {
        return fn.call(ctx, a1, a2, a3, a4);
    }
}
function nodeback(err, res) {
    if (err) this.reject(err);
    else this.resolve(res);
}

cl.getAsync = function(id) {
    var def = q.defer()
    cl.get(id, bind(nodeback, def));
    return def.promise;
}

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
    })
    .then(function(ok) { done(null, ok) }, done);
}

module.exports.end = function() {
    cl.end();
}

