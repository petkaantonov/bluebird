global.useAction = true;
var Action = require('action-js');
require('../lib/fakesP');

module.exports = function upload(stream, idOrPath, tag, done) {
    var queries = new Array(global.parallelQueries);
    var tx = db.begin();
    for( var i = 0, len = queries.length; i < len; ++i ) {
        queries[i] = FileVersion.insert({index: i}).execWithin(tx);
    }
    Action.parallel(queries).next(function() {
        tx.commit();
        done();
    })
    .guard(function(err) {
        tx.rollback();
        done(err);
    }).go();
}
