require('../lib/fakes');

module.exports = function upload(stream, idOrPath, tag, _) {
    var blob = blobManager.create(account);
    var tx = db.begin();
    try {
        var blobId =  blob.put(stream, _); 
        var file =  self.byUuidOrPath(idOrPath).get(_); 
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
            var newId = uuid.v1();
            var file = {
                id: newId,
                userAccountId: userAccount.id,
                name: fileName,
                version: version.id
            }
            var q =  self.createQuery(idOrPath, file, _);
             q.execWithin(tx, _);
        }
        FileVersion.insert({fileId: file.id,versionId: version.id})
            .execWithin(tx, _);
        File.whereUpdate({id: file.id}, {version: version.id})
            .execWithin(tx, _); 
        tx.commit(_);
    } catch (err) {
        tx.rollback();
        throw err; //Error(err);
    }
};

