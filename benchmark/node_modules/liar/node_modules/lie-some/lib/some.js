var promise = require('lie');
var cast = require('lie-cast');
var qMap = require('lie-quickmap');
var each = require('lie-quickeach');
var use = require('lie-use');
function some(array) {
    return promise(function(fulfill, reject) {
        var len = array.length;
        var succeded = [];
        var failed = [];
        function check(){
            if (failed.length === len) {
                reject(failed);
            }else if((succeded.length+failed.length)===len){
                 fulfill(succeded);
            }
        }

        each(qMap(array,cast),function(v) {
            v.then(function(a) {
                succeded.push(a);
                check();
            },function(a) {
                failed.push(a);
                check();
            });
        });
    });
}
module.exports = function(array){
    return use(array,some);
};
