global.useBluebird = true;
global.useQ = false;
var bluebird = require('bluebird');
require('../lib/fakesP-ctx');

module.exports = function upload(stream, idOrPath, tag, done) {
    var blob = blobManager.create(account);
    var tx = db.begin();

    bluebird.join(
        blob.put(stream),
        self.byUuidOrPath(idOrPath).get()
    ).bind({
        done: done,
        stream: stream,
        idOrPath: idOrPath,
        tag: tag,
        version: void 0,
        fileId: void 0,
        file: void 0,
        tx: tx,
        newId: void 0,
        blob: blob
    })
    .spread(step1)
    .then(step2)
    .then(step3)
    .then(step4)
    .then(step5)
    .catch(err);
}

function step1( blobId, file ) {
    this.file = file;
    var previousId = file ? file.version : null;
    var version = this.version = {
        userAccountId: userAccount.id,
        date: new Date(),
        blobId: blobId,
        creatorId: userAccount.id,
        previousId: previousId
    };
    version.id = Version.createHash(version);
    return Version.insert(version).execWithin(this.tx);
}

function step2() {
    if (!this.file) {
        var splitPath = this.idOrPath.split('/');
        var fileName = splitPath[splitPath.length - 1];
        var newId = this.newId = uuid.v1();
        return self.createQuery(this.idOrPath, {
            id: newId,
            userAccountId: userAccount.id,
            name: fileName,
            version: this.version.id
        }).bind(this).then(step2$1).then(step2$2);
    } else {
        return this.file.id;
    }
}

function step2$1(q) {
    return q.execWithin(this.tx);
}

function step2$2() {
    return this.newId;
}

function step3(fileId) {
    this.fileId = fileId;
    return FileVersion.insert({
        fileId: fileId,
        versionId: this.version.id
    }).execWithin(this.tx);
}

function step4() {
    return File.whereUpdate(
        {id: this.fileId},
        {version: this.version.id}
    ).execWithin(this.tx);
}

function step5() {
    this.tx.commit();
    return this.done();
}

function err(e) {
    this.tx.rollback();
    return this.done(e);
}
