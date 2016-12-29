require('../lib/fakes');

module.exports = function upload(stream, idOrPath, tag, _) {
    try {
        var blob = blobManager.create(account);
        var tx = db.begin();
        var blobId = blob.put(stream, _);
        var file = self.byUuidOrPath(idOrPath).get(_);

        var previousId = file ? file.version : null;
        var version = {
            userAccountId: userAccount.id,
            date: new Date(),
            blobId: blobId,
            creatorId: userAccount.id,
            previousId: previousId,
        };
        version.id = Version.createHash(version);
        Version.insert(version).execWithin(tx, _);
        if (!file) {
            var splitPath = idOrPath.split('/');
            var fileName = splitPath[splitPath.length - 1];
            file = {
                id: uuid.v1(),
                userAccountId: userAccount.id,
                name: fileName,
                version: version.id
            }
            var query = self.createQuery(idOrPath, file, _);
            query.execWithin(tx, _);
        }
        FileVersion.insert({fileId: file.id, versionId: version.id})
            .execWithin(tx, _);
        File.whereUpdate({id: file.id}, {version: version.id})
            .execWithin(tx, _);
        tx.commit();
    } catch (err) {
        tx.rollback();
        throw err;
    }
}
