require('../lib/fakes');

module.exports = function upload(stream, idOrPath, tag, done) {
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

    for( var i = 0; i < total; ++i ) {
        FileVersion.insert({index: i}).execWithin(tx, callback);
    }
}
