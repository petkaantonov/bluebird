var promise = require('lie');
var cast = require('lie-cast');
var qMap = require('lie-quickmap');
var each = require('lie-quickeach');
var use = require('lie-use');
function all(array) {
    return promise(function(fulfill, reject) {
        var len = array.length;
        if(!len){
            fulfill([]);
        }
        var fulfilled = 0;
        var out = [];
        var onSuccess = function(n) {
            return function(v) {
                out[n] = v;
                if (++fulfilled === len) {
                    fulfill(out);
                }
            };
        };
        each(qMap(array,cast),function(v, i) {
            v.then(onSuccess(i), function(a) {
                reject(a);
            });
        });
    });
}
module.exports = function(array){
    return use(array,all);
};
