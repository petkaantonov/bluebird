var map = require('lie-map');
var cast = require('lie-cast');
function every(array,func){
    var hasfunc = typeof func === 'function';
    var code = Math.random().toString();
    return map(array,function(value){
        var cvalue = cast(value);
        if(hasfunc){
            cvalue = cvalue.then(func);
        }
        return cvalue.then(function(bool){
            if(!bool){
                throw code;
            }
            return;
        });
    }).then(function(){
        return true;
    },function(reason){
        if(reason===code){
            return false;
        }else{
            throw reason;
        }
    });
}
module.exports = every;