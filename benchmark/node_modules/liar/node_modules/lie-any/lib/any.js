var qMap = require('lie-quickmap');
var all = require('lie-all');
var promise = require('lie');
var cast = require('lie-cast');
function any(array,func){
    var hasfunc = typeof func === 'function';
    return promise(function(yes,no){
        cast(array).then(function(arr){
            all(qMap(arr,function(value){
                var cvalue = cast(value);
                if(hasfunc){
                    cvalue = cvalue.then(func);
                }
                return cvalue.then(function(pValue){
                    if(pValue){
                        yes(true);
                    }else{
                        return false;
                    }
                });
            })).then(function(){
                yes(false);
            },no);
       });
    });
}
module.exports = any;
