var qMap = require('lie-quickmap');
var all = require('lie-all');
var cast = require('lie-cast');
function apply(){
    var args = qMap(arguments);
    var func = args.shift();
    if(args.length===0){
        return cast(func());
    }else if(args.length===1){
        return cast(args[0]).then(func);
    }
    return all(args).then(function(results){
        return func.apply(null,results);
    });
}
module.exports = apply;