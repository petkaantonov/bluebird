
var Rx = require('rx');
var f = require('./dummy');

var dummy1 = f.dummy(1),
    dummyt1 = f.dummyt(1);

// Observable wrapper
function dummyObsWrap(fn) {
    return function() {
        return Rx.Observable.create(function(observer) {
            fn(function(err, res) {
                if(err) 
                    return observer.onError(err);
                observer.onNext(res);
                observer.onCompleted();
            });
        });
    }
}
function dummyO() {
    return dummyObsWrap(dummy(1)); 
}
function dummytO() {
    return dummyObsWrap(dummyt(1));
}

makefakes(dummyO, dummytO, dummyObsWrap);

