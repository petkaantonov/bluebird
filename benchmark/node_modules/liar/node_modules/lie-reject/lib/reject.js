var promise = require('lie');
function reject(value){
    return promise(function(yes,no){
        no(value);
    });
}
module.exports = reject;