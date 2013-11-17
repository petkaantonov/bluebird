import { Promise } from "./promise";

function resolve(thenable) {
  return new Promise(function(resolve, reject) {
    resolve(thenable);
  });
}

export { resolve };
