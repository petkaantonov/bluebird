global.useDeferred = true;

var deferred = require('deferred');

require('../lib/fakesP');

function identity(v) {
    return v;
}

module.exports = function upload(stream, idOrPath, tag, done) {
    var queries = new Array(global.parallelQueries);
    var tx = db.begin();

    for( var i = 0, len = queries.length; i < len; ++i ) {
        queries[i] = FileVersion.insert({index: i}).execWithin(tx);
    }

    //Couldn't find .all in docs, this seems closest
    deferred.map(queries, identity)(function() {
        tx.commit();
        done();
    }, function(err) {
        tx.rollback();
        done(err);
    });
}
