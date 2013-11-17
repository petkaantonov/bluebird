import { Promise } from "./promise";
import { all } from "./all";

function makeNodeCallbackFor(resolve, reject) {
  return function (error, value) {
    if (error) {
      reject(error);
    } else if (arguments.length > 2) {
      resolve(Array.prototype.slice.call(arguments, 1));
    } else {
      resolve(value);
    }
  };
}

function denodeify(nodeFunc) {
  return function()  {
    var nodeArgs = Array.prototype.slice.call(arguments), resolve, reject;
    var thisArg = this;

    var promise = new Promise(function(nodeResolve, nodeReject) {
      resolve = nodeResolve;
      reject = nodeReject;
    });

    all(nodeArgs).then(function(nodeArgs) {
      nodeArgs.push(makeNodeCallbackFor(resolve, reject));

      try {
        nodeFunc.apply(thisArg, nodeArgs);
      } catch(e) {
        reject(e);
      }
    });

    return promise;
  };
}

export { denodeify };
