global.useNative = true;

try {
    if (Promise.race.toString() !== 'function race() { [native code] }')
        throw 0;
} catch (e) {
    throw new Error("No ES6 promises available");
}

require('../lib/fakesP');

module.exports = async function upload(stream, idOrPath, tag, done) {
    var queries = new Array(global.parallelQueries);
    var tx = db.begin();

    for( var i = 0, len = queries.length; i < len; ++i ) {
        queries[i] = FileVersion.insert({index: i}).execWithin(tx);
    }

    try {
        await Promise.all(queries);
        tx.commit();
        done();
    }
    catch(e) {
        tx.rollback();
        done(e);
    }
};
