import { Promise } from "./promise";

function reject(reason) {
  return new Promise(function (resolve, reject) {
    reject(reason);
  });
}

export { reject };
