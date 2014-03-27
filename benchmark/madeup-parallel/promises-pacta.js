global.usePacta = true;

var Promise = require('pacta');

require('../lib/fakesP');

module.exports = function upload(stream, idOrPath, tag, done) {
    var p = Promise.of([]);
    var tx = db.begin();

    for( var i = 0, len = global.parallelQueries; i < len; ++i ) {
        p = p.conjoin(FileVersion.insert({index: i}).execWithin(tx));
    }

    p.then(function() {
        tx.commit();
        done();
    }, function(err) {
        tx.rollback();
        done(err);
    });
}
