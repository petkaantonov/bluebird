var immediate = require('immediate');
// Creates a deferred: an object with a promise and corresponding resolve/reject methods
function Promise(resolver) {
     if (!(this instanceof Promise)) {
        return new Promise(resolver);
    }
    var sucessQueue = [];
    var failureQueue = [];
    var resolved = false;
    // The `handler` variable points to the function that will
    // 1) handle a .then(onFulfilled, onRejected) call
    // 2) handle a .resolve or .reject call (if not fulfilled)
    // Before 2), `handler` holds a queue of callbacks.
    // After 2), `handler` is a simple .then handler.
    // We use only one function to save memory and complexity.
     // Case 1) handle a .then(onFulfilled, onRejected) call
    function pending(onFulfilled, onRejected){
        return Promise(function(success,failure){
            if(typeof onFulfilled === 'function'){
                sucessQueue.push({
                    resolve: success,
                    reject: failure,
                    callback:onFulfilled
                });
            }else{
                sucessQueue.push({
                    next: success,
                    callback:false
                });
            }
            if(typeof onRejected === 'function'){
                failureQueue.push({
                    resolve: success,
                    reject: failure,
                    callback:onRejected
                });
            }else{
                failureQueue.push({
                    next: failure,
                    callback:false
                });
            }
        });
    }
    this.then = function(onFulfilled, onRejected) {
        return resolved?resolved(onFulfilled, onRejected):pending(onFulfilled, onRejected);
    };
    // Case 2) handle a .resolve or .reject call
        // (`onFulfilled` acts as a sentinel)
        // The actual function signature is
        // .re[ject|solve](sentinel, success, value)
    function resolve(success, value){
        if(resolved){
            return;
        }
        resolved = createHandler(this, value, success?0:1);
        var queue = success ? sucessQueue : failureQueue;
        var len = queue.length;
        var i = -1;
        while(++i < len) {
            if (queue[i].callback) {
                immediate(execute,queue[i].callback, value, queue[i].resolve, queue[i].reject);
            }else if(queue[i].next){
                queue[i].next(value);
            }
        }
        // Replace this handler with a simple resolved or rejected handler
    }
    var fulfill = resolve.bind(this,true);
    var reject = resolve.bind(this,false);
    try{
        resolver(function(a){
            if(a && typeof a.then==='function'){
                a.then(fulfill,reject);
            }else{
                fulfill(a);
            }
        },reject);
    }catch(e){
        reject(e);
    }
}

// Creates a fulfilled or rejected .then function
function createHandler(scope, value, success) {
    return function() {
        var callback = arguments[success];
        if (typeof callback !== 'function') {
            return scope;
        }
        return Promise(function(resolve,reject){
            immediate(execute,callback,value,resolve,reject);
       });
    };
}

// Executes the callback with the specified value,
// resolving or rejecting the deferred
function execute(callback, value, resolve, reject) {
        try {
            var result = callback(value);
            if (result && typeof result.then === 'function') {
                result.then(resolve, reject);
            }
            else {
                resolve(result);
            }
        }
        catch (error) {
            reject(error);
        }
}
module.exports = Promise;
