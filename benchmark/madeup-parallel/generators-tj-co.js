global.useNative = true;

try {
    if (Promise.race.toString() !== 'function race() { [native code] }')
        throw 0;
} catch (e) {
    throw new Error("No ES6 promises available");
}

var co = require('co');
require('../lib/fakesP');

module.exports = function upload(stream, idOrPath, tag, done) {
    return co(function* () {
        var queries = new Array(global.parallelQueries);
        var tx = db.begin();

        for( var i = 0, len = queries.length; i < len; ++i ) {
            queries[i] = FileVersion.insert({index: i}).execWithin(tx);
        }

        try {
            yield Promise.all(queries);
            tx.commit();
            done();
        }
        catch(e) {
            tx.rollback();
            done(e);
        }
    });
};
