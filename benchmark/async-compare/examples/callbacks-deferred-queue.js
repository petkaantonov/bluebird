require('../lib/fakes');
var dq = require('deferred-queue');

module.exports = function upload(stream, idOrPath, tag, done) {
    var blob = blobManager.create(account);
    var tx = db.begin();
    var blobId, file, version, fileId;
    dq ()
        .on ("error", function (error){console.log(error)
          tx.rollback();
        })
        .push (function writeBlob(callback) {
            blob.put(stream, callback);
        })
        .push (function afterBlobWritten(callback) {
            blobId = undefined // iBlobId;
            self.byUuidOrPath(idOrPath).get(callback);
        })
        .push (function afterFileFetched(callback) {
            file = undefined; //iFile;
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
            Version.insert(version).execWithin(tx, callback);
        })
        .push (function afterVersionInserted(callback) {
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
                        callback(err, newId);
                    });

                })
            }
            else return callback(null, file.id);
        }, function (error, id){
          fileId = id;
        })
        .push (function afterFileExists(callback) {
            FileVersion.insert({fileId: fileId, versionId: version.id})
                .execWithin(tx, callback);
        })
        .push (function afterFileVersionInserted(callback) {
            File.whereUpdate({id: fileId}, { version: version.id })
                .execWithin(tx, callback);
        })
        .push (function afterFileUpdated(callback) {
            tx.commit(callback);
            done ();
        });
}
