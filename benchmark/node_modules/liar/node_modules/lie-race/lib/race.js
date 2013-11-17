var promise = require('lie');
var each = require('lie-quickeach');
var use = require('lie-use');
function race(array) {
    return promise(function(fulfill, reject) {
        each(array,function(v){
            v.then(fulfill, reject);
        });
    });
}
module.exports = function(array){
    return use(array,race);
};
