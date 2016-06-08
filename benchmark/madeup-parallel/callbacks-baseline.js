require('../lib/fakes');

module.exports = function upload(stream, idOrPath, tag, done) {
    var tx = db.begin();
    var current = 0;
    var total = global.parallelQueries;



    for( var i = 0; i < total; ++i ) {
        FileVersion.insert({index: i}).execWithin(tx, function onComplete(err) {
            if (onComplete.called) return;
            onComplete.called = true;
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
        });
    }
}
