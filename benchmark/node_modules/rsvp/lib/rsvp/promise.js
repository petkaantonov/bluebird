import { config } from "./config";
import { EventTarget } from "./events";

function objectOrFunction(x) {
  return isFunction(x) || (typeof x === "object" && x !== null);
}

function isFunction(x){
  return typeof x === "function";
}

var Promise = function(resolver) {
  var promise = this,
  resolved = false;

  if (typeof resolver !== 'function') {
    throw new TypeError('You must pass a resolver function as the sole argument to the promise constructor');
  }

  if (!(promise instanceof Promise)) {
    return new Promise(resolver);
  }

  var resolvePromise = function(value) {
    if (resolved) { return; }
    resolved = true;
    resolve(promise, value);
  };

  var rejectPromise = function(value) {
    if (resolved) { return; }
    resolved = true;
    reject(promise, value);
  };

  this.on('promise:failed', function(event) {
    this.trigger('error', { detail: event.detail });
  }, this);

  this.on('error', onerror);

  try {
    resolver(resolvePromise, rejectPromise);
  } catch(e) {
    rejectPromise(e);
  }
};

function onerror(event) {
  if (config.onerror) {
    config.onerror(event.detail);
  }
}

var invokeCallback = function(type, promise, callback, event) {
  var hasCallback = isFunction(callback),
      value, error, succeeded, failed;

  if (hasCallback) {
    try {
      value = callback(event.detail);
      succeeded = true;
    } catch(e) {
      failed = true;
      error = e;
    }
  } else {
    value = event.detail;
    succeeded = true;
  }

  if (handleThenable(promise, value)) {
    return;
  } else if (hasCallback && succeeded) {
    resolve(promise, value);
  } else if (failed) {
    reject(promise, error);
  } else if (type === 'resolve') {
    resolve(promise, value);
  } else if (type === 'reject') {
    reject(promise, value);
  }
};

Promise.prototype = {
  constructor: Promise,

  isRejected: undefined,
  isFulfilled: undefined,
  rejectedReason: undefined,
  fulfillmentValue: undefined,

  then: function(done, fail) {
    this.off('error', onerror);

    var thenPromise = new this.constructor(function() {});

    if (this.isFulfilled) {
      config.async(function(promise) {
        invokeCallback('resolve', thenPromise, done, { detail: promise.fulfillmentValue });
      }, this);
    }

    if (this.isRejected) {
      config.async(function(promise) {
        invokeCallback('reject', thenPromise, fail, { detail: promise.rejectedReason });
      }, this);
    }

    this.on('promise:resolved', function(event) {
      invokeCallback('resolve', thenPromise, done, event);
    });

    this.on('promise:failed', function(event) {
      invokeCallback('reject', thenPromise, fail, event);
    });

    return thenPromise;
  },

  fail: function(fail) {
    return this.then(null, fail);
  }
};

EventTarget.mixin(Promise.prototype);

function resolve(promise, value) {
  if (promise === value) {
    fulfill(promise, value);
  } else if (!handleThenable(promise, value)) {
    fulfill(promise, value);
  }
}

function handleThenable(promise, value) {
  var then = null,
  resolved;

  try {
    if (promise === value) {
      throw new TypeError("A promises callback cannot return that same promise.");
    }

    if (objectOrFunction(value)) {
      then = value.then;

      if (isFunction(then)) {
        then.call(value, function(val) {
          if (resolved) { return true; }
          resolved = true;

          if (value !== val) {
            resolve(promise, val);
          } else {
            fulfill(promise, val);
          }
        }, function(val) {
          if (resolved) { return true; }
          resolved = true;

          reject(promise, val);
        });

        return true;
      }
    }
  } catch (error) {
    reject(promise, error);
    return true;
  }

  return false;
}

function fulfill(promise, value) {
  config.async(function() {
    promise.trigger('promise:resolved', { detail: value });
    promise.isFulfilled = true;
    promise.fulfillmentValue = value;
  });
}

function reject(promise, value) {
  config.async(function() {
    promise.trigger('promise:failed', { detail: value });
    promise.isRejected = true;
    promise.rejectedReason = value;
  });
}

export { Promise };
