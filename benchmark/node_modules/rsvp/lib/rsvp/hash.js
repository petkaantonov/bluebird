import { defer } from "./defer";

function size(object) {
  var s = 0;

  for (var prop in object) {
    s++;
  }

  return s;
}

function hash(promises) {
  var results = {}, deferred = defer(), remaining = size(promises);

  if (remaining === 0) {
    deferred.resolve({});
  }

  var resolver = function(prop) {
    return function(value) {
      resolveAll(prop, value);
    };
  };

  var resolveAll = function(prop, value) {
    results[prop] = value;
    if (--remaining === 0) {
      deferred.resolve(results);
    }
  };

  var rejectAll = function(error) {
    deferred.reject(error);
  };

  for (var prop in promises) {
    if (promises[prop] && typeof promises[prop].then === 'function') {
      promises[prop].then(resolver(prop), rejectAll);
    } else {
      resolveAll(prop, promises[prop]);
    }
  }

  return deferred.promise;
}

export { hash };
