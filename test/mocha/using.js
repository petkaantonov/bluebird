var assert = require("assert");

var Promise = require("../../js/debug/bluebird.js");

var using = Promise.using;
var delay = Promise.delay;
var error = new Error("");

function Resource() {
    this.isClosed = false;
    this.closesCalled = 0;
}

Resource.prototype.close = function() {
    this.closesCalled++;
    if (this.isClosed) {
        return;
    }
    this.isClosed = true;
};

Resource.prototype.closeError = function() {
    throw error;
};

function _connect() {
    return new Promise(function(resolve) {
        setTimeout(function(){
            resolve(new Resource())
        }, 13);
    });
}

function connect() {
    return _connect().disposer("close");
}

function connectCloseError() {
    return _connect().disposer("closeError");
}

function connectNoSuchMethod() {
    return _connect().disposer("nosuchmethod");
}

function connectError() {
    return new Promise(function(resolve, reject) {
        setTimeout(function(){
            reject(error);
        }, 13);
    });
}


describe("Promise.using", function() {
    specify("simple happy case", function(done) {
        var res;

        using(connect(), function(connection){
            res = connection;
        }).then(function() {
            assert(res.isClosed);
            assert.equal(res.closesCalled, 1);
            done();
        });
    });

    specify("simple async happy case", function(done) {
        var res;
        var async = false;

        using(connect(), function(connection) {
            res = connection;
            return delay(50).then(function() {
                async = true;
            });
        }).then(function() {
            assert(async);
            assert(res.isClosed);
            assert.equal(res.closesCalled, 1);
            done();
        });
    });

    specify("simple unhappy case", function(done) {
        var a = connect();
        var b = connectError();
        using(a, b, function(a, b) {
            assert(false);
        }).catch(function() {
            assert(a.value().isClosed);
            assert.equal(a.value().closesCalled, 1);
            done();
        })
    })
})
