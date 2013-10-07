require('../lib/fakes');
function bind(f, ctx) {
    return function bound() {
        return f.apply(ctx, arguments);
    }
}

module.exports = function upload(stream, idOrPath, tag, done) {
    new Uploader(stream, idOrPath, tag, done).run();
}

function Uploader(stream, idOrPath, tag, done) {
    this.stream = stream;
    this.idOrPath = idOrPath;
    this.tag = tag;
    this.done = done;
    this.file = null;
    this.version = null;
    this.blobId = null;
}

Uploader.prototype.backoff = function backoff (err) {
    this.tx.rollback();
    return this.done(err);
}


Uploader.prototype.run = function run () {
    var blob = blobManager.create(account);
    this.tx = db.begin();
    blob.put(this.stream, bind(this.afterBlobWritten, this));
}

Uploader.prototype.afterBlobWritten = function afterBlobWritten(err, blobId) {
    if (err) return this.done(err);
    this.blobId = blobId;
    self.byUuidOrPath(this.idOrPath)
        .get(bind(this.afterFileFetched, this));
}

Uploader.prototype.afterFileFetched = function afterFileFetched(err, file) {
    if (err) return this.done(err);
    this.file = file;

    var previousId = file ? file.version : null;
    var version = this.version = {
        userAccountId: userAccount.id,
        date: new Date(),
        blobId: this.blobId,
        creatorId: userAccount.id,
        previousId: previousId,
        mergedId: null,
        mergeType: 'mine',
        comment: '',
        tag: this.tag
    };
    version.id = Version.createHash(version);
    Version.insert(version).execWithin(
        this.tx, bind(this.afterVersionInserted, this));
}

Uploader.prototype.afterVersionInserted = function afterVersionInserted(err) {
    if (err) return this.backoff(err);
    if (!this.file) {
        var splitPath = this.idOrPath.split('/');
        var fileName = splitPath[splitPath.length - 1];
        var file = this.file = {
            id: uuid.v1(),
            userAccountId: userAccount.id,
            type: 'file',
            name: fileName,
            version: this.version.id
        };
        self.createQuery(this.idOrPath, file,
            bind(this.afterQueryCreated, this));
    }
    else return afterFileExists();
}

Uploader.prototype.afterQueryCreated = function afterQueryCreated(err, q) {
    if (err) return this.backoff(err);
    q.execWithin(this.tx, bind(this.afterFileExists, this));
}

Uploader.prototype.afterFileExists = function afterFileExists(err) {

    if (err) return this.backoff(err);

    FileVersion.insert({fileId: this.file.id, versionId: this.version.id})
        .execWithin(this.tx, bind(this.afterFileVersionInserted, this));
}

Uploader.prototype.afterFileVersionInserted = function afterFileVersionInserted(err) {
    if (err) return this.backoff(err);
    File.whereUpdate({id: this.file.id}, { version: this.version.id })
        .execWithin(this.tx, bind(this.afterFileUpdated, this));
}

Uploader.prototype.afterFileUpdated = function afterFileUpdated(err) {
    if (err) return this.backoff(err);
    this.tx.commit(this.done);
}


