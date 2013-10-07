require('../lib/fakesSJS-dst.js');

module.exports = function upload(stream, idOrPath, tag, done) {
    var blob = blobManager.create(account);
    var blobId = blob.put(stream);
    var file = self.byUuidOrPath(idOrPath).get();
    var previousId = file ? file.version : null;
    var version = {
        userAccountId: userAccount.id,
        date: new Date(),
        blobId: blobId,
        creatorId: userAccount.id,
        previousId: previousId
    }; 
    version.id = Version.createHash(version);  
    var tx = db.begin();

    try {
        Version.insert(version).execWithin(tx);

        var fileId;
        if (!file) {
            var splitPath = idOrPath.split('/');
            var fileName = splitPath[splitPath.length - 1];
            fileId = uuid.v1();
            self.createQuery(idOrPath, 
                             {
                               id: fileId,
                               userAccountId: userAccount.id,
                               name: fileName,
                               version: version.id
                             })
                .execWithin(tx);
        } 
        else 
           fileId = file.id;

       FileVersion.insert({fileId: fileId,versionId: version.id})
            .execWithin(tx);
       File.whereUpdate({id: fileId}, {version: version.id})
            .execWithin(tx);
    } catch(e) {
        tx.rollback();
        done(e); // if the caller were SJS, we would just throw()
    }
    tx.commit();
    done(); // if the caller were SJS, we would just return
}