var fibby = require('fibby');

module.exports = fibby.fn(function upload(f, stream, idOrPath, tag) {
    var blob = blobManager.create(account);
    var tx = db.begin();
    try {
        var blobId = f.yield(blob.put(stream, f.resume.t)); 
        var file = f.yield(self.byUuidOrPath(idOrPath).get(f.resume.t)); 
        var previousId = file ? file.version : null;
        var version = {
            userAccountId: userAccount.id,
            date: new Date(),
            blobId: blobId,
            creatorId: userAccount.id,
            previousId: previousId,
            mergedId: null,
            mergeType: 'mine',
            comment: '',
            tag: tag
        };
        version.id = Version.createHash(version);
        f.yield(Version.insert(version).execWithin(tx, f.resume.t));
        if (!file) {
            var splitPath = idOrPath.split('/');
            var fileName = splitPath[splitPath.length - 1];
            var newId = uuid.v1();
            var file = {
                id: newId,
                userAccountId: userAccount.id,
                type: 'file',
                name: fileName,
                version: version.id
            }
            var q = f.yield(self.createQuery(idOrPath, file, f.resume.t));
            f.yield(q.execWithin(tx, f.resume.t));
        }
        f.yield(FileVersion
            .insert({fileId: file.id,versionId: version.id})
            .execWithin(tx, f.resume.t));

        f.yield(File
            .whereUpdate({id: file.id}, {version: version.id})
            .execWithin(tx, f.resume.t)); 
        f.yield(tx.commit(f.resume.t));
    } catch (err) {
        tx.rollback();
        throw err;
    }
});
