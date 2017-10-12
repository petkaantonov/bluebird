"use strict";
module.exports = function(
    Promise
) {
    function awaitAll(promises) {
        let resolves = []
        let rejects = []
        let _promises = [];
        // This function can be changed by any other iterator
        for (let promise of promises) {
            _promises.push(
                // Promising each element
                Promise.resolve(promise)
                    .then(res => resolves.push(res))
                    .catch(res => rejects.push(res))
            )
        }

        // It has to be defined after all
        return Promise.all(_promises)
            .then(() => {
                if (rejects.length === 0) {
                    return Promise.resolve(resolves);
                }
                return Promise.reject(rejects);
            })
    }
    
    Promise.awaitAll = Promise.prototype.awaitAll = awaitAll;
}
