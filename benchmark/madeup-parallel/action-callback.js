global.useAction = true;
var Action = require('action-js');
require('../lib/fakesP');

module.exports = function upload(stream, idOrPath, tag, done) {
    var queries = new Array(global.parallelQueries);
    var tx = db.begin();
    var current = 0;
    var total = global.parallelQueries;

    function callback(err) {
        if( err ) {
            tx.rollback();
            done(err);
        }
        else {
            current++;
            if( current === total ) {
                tx.commit();
                done();
            }
        }
    }
    for( var i = 0, len = queries.length; i < len; ++i ) {
        queries[i] = FileVersion.insert({index: i}).execWithin(tx)._go(callback);
    }
}
