require('../lib/fakes');

// Futures work on streamlined function so we need to wrap execWithin
function execWithin(query, tx, _) {
    return query.execWithin(tx, _);
}

module.exports = function upload(stream, idOrPath, tag, _) {
    try {
        var queries = new Array(global.parallelQueries);
        var tx = db.begin();

        for (var i = 0, len = queries.length; i < len; ++i ) {
            queries[i] = execWithin(FileVersion.insert({index: i}), tx, !_);
        }

        for (var i = 0, len = queries.length; i < len; ++i ) {
            queries[i](_);
        }

        tx.commit();
    } catch (err) {
        tx.rollback();
        throw err;
    }
};
