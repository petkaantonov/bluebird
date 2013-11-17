var resolve = require('lie-resolve');
function cast(thing){
    if(thing && typeof thing.then === 'function'){
        return thing;
    }else{
        return resolve(thing);
    }
}
module.exports = cast;