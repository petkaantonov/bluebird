var async = require("gens");
require('../lib/fakes');

module.exports = function upload(stream, idOrPath, tag, done) {
    var tx = db.begin()
    uploadTransaction(tx, stream, idOrPath, tag, function (err) {
        if (err) tx.rollback()
        done(err);
    })
}

var uploadTransaction = async(function* upload(tx, stream, idOrPath, tag) {
    var blob = blobManager.create(account)
    var file = yield self.byUuidOrPath(idOrPath).get;
    var blobId = yield blob.put.bind(blob, stream);
    var previousId = file ? file.version : null
    var version = {
        userAccountId: userAccount.id,
        date: new Date(),
        blobId: blobId,
        creatorId: userAccount.id,
        previousId: previousId
    }
    version.id = Version.createHash(version)
    yield Version.insert(version).execWithin.bind(null, tx);
    if (!file) {
        var splitPath = idOrPath.split("/")
        var fileName = splitPath[splitPath.length - 1]
        file = {
            id: uuid.v1(),
            userAccountId: userAccount.id,
            name: fileName,
            version: version.id
        };
        var query = yield self.createQuery.bind(self, idOrPath, file);
        yield query.execWithin.bind(query, tx)
    } 
    yield FileVersion.insert({ fileId: file.id, versionId: version.id })
            .execWithin.bind(null, tx);
    yield File.whereUpdate({ id: file.id }, { version: version.id })
            .execWithin.bind(null, tx);
    yield tx.commit
});
