require('../lib/fakes');

module.exports = function upload(stream, idOrPath, tag, done) {
    var blob = blobManager.create(account);
    var tx = db.begin();
    function backoff(err) {
        tx.rollback();
        return done(err);
    }
    blob.put(stream, afterBlobWritten);
    var blobId;
    function afterBlobWritten(err, iBlobId) {
        if (err) return done(err);
        blobId = iBlobId;
        self.byUuidOrPath(idOrPath).get(afterFileFetched);
    }
    var file, version;
    function afterFileFetched(err, iFile) {
        if (err) return done(err);
        file = iFile;
        var previousId = file ? file.version : null;
        version = {
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
        Version.insert(version).execWithin(tx, afterVersionInserted);
    }
    function afterVersionInserted(err) {
        if (err) return backoff(err);
        if (!file) {
            var splitPath = idOrPath.split('/');
            var fileName = splitPath[splitPath.length - 1];
            var newId = uuid.v1();
            self.createQuery(idOrPath, {
                id: newId,
                userAccountId: userAccount.id,
                type: 'file',
                name: fileName,
                version: version.id
            }, function (err, q) {
                if (err) return backoff(err);
                q.execWithin(tx, function (err) {
                    afterFileExists(err, newId);
                });

            })
        }
        else return afterFileExists(null, file.id);
    }
    var fileId;
    function afterFileExists(err, iFileId) {
        fileId = iFileId;
        if (err) return backoff(err);
        FileVersion.insert({fileId: fileId, versionId: version.id})
            .execWithin(tx, afterFileVersionInserted);
    }
    function afterFileVersionInserted(err) {
        if (err) return backoff(err);
        File.whereUpdate({id: fileId}, { version: version.id })
            .execWithin(tx, afterFileUpdated);
    }
    function afterFileUpdated(err) {
        if (err) return backoff(err);
        tx.commit(done);
    }
}
