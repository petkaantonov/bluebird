var promise = require('lie');
function resolve(value){
    return promise(function(yes){
        yes(value);
    });
}
module.exports = resolve;