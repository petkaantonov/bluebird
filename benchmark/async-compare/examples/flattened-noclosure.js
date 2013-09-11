
require('../lib/fakes');

module.exports = function upload(stream, idOrPath, tag, done) {
    var blob = blobManager.create(account);
    var tx = db.begin();
    blob.put(stream, afterBlobWritten(tx, idOrPath, tag, done));
    var blobId;
}

function backoff(err, tx) {
    tx.rollback();
    return done(err);
}
function afterBlobWritten(tx, idOrPath, tag, done) { 
    return function (err, iBlobId) {
        if (err) return done(err);
        blobId = iBlobId;
        self.byUuidOrPath(idOrPath).get(afterFileFetched(tx, idOrPath, tag, done));
    }
}

function afterFileFetched(tx, idOrPath, tag, done) { 
    return function(err, file) {
        if (err) return done(err);
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
        Version.insert(version).execWithin(
            tx, afterVersionInserted(tx, file, version, idOrPath, done));
    }
}
function afterVersionInserted(tx, file, version, idOrPath, done) { 
    return function (err) {
        if (err) return backoff(err, tx);
        if (!file) {
            var splitPath = idOrPath.split('/');
            var fileName = splitPath[splitPath.length - 1];
            var file = {
                id: uuid.v1(),
                userAccountId: userAccount.id,
                type: 'file',
                name: fileName,
                version: version.id
            };
            self.createQuery(idOrPath, file, function (err, q) {
                if (err) return backoff(err, tx);
                q.execWithin(tx, function (err) {
                    afterFileExists(err, tx, file, version, done);
                });

            })
        }
        else return afterFileExists(null, tx, file, version, done);
    }
}

function afterFileExists(err, tx, file, version, done) {

    if (err) return backoff(err, tx);
    FileVersion.insert({fileId: file.id, versionId: version.id})
        .execWithin(tx, afterFileVersionInserted(tx, file, version, done));
}

function afterFileVersionInserted(tx, file, version, done) {
    return function (err) {
        if (err) return backoff(err, tx);
        File.whereUpdate({id: file.id}, { version: version.id })
        .execWithin(tx, afterFileUpdated(tx, done));
    }
}
function afterFileUpdated(tx, done) {
    return function(err) {
        if (err) return backoff(err, tx);
        tx.commit(done);
    }
}


