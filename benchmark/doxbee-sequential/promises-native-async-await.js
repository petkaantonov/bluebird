global.useNative = true;

try {
    if (Promise.race.toString() !== 'function race() { [native code] }')
        throw 0;
} catch (e) {
    throw new Error("No ES6 promises available");
}

require('../lib/fakesP');

module.exports = async function upload(stream, idOrPath, tag, done) {
    try {
        var blob = blobManager.create(account);
        var tx = db.begin();
        var blobId = await blob.put(stream);
        var file = await self.byUuidOrPath(idOrPath).get();

        var previousId = file ? file.version : null;
        version = {
            userAccountId: userAccount.id,
            date: new Date(),
            blobId: blobId,
            creatorId: userAccount.id,
            previousId: previousId,
        };
        version.id = Version.createHash(version);
        await Version.insert(version).execWithin(tx);
        if (!file) {
            var splitPath = idOrPath.split('/');
            var fileName = splitPath[splitPath.length - 1];
            file = {
                id: uuid.v1(),
                userAccountId: userAccount.id,
                name: fileName,
                version: version.id
            }
            var query = await self.createQuery(idOrPath, file);
            await query.execWithin(tx);
        }
        await FileVersion.insert({fileId: file.id, versionId: version.id})
            .execWithin(tx);
        await File.whereUpdate({id: file.id}, {version: version.id})
            .execWithin(tx);
        tx.commit();
        done();
    } catch (err) {
        tx.rollback();
        done(err);
    }
};
