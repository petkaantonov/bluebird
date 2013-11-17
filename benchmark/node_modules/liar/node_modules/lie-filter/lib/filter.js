var map = require('lie-map');
var zipwith = require('lie-zipwith');
function filter(array,func){
    return map(array,func).then(function(bools){
        return zipwith(function(value,keep){
            if(keep){
                return value;
            }else{
                return keep;
            }
        },array,bools);
    }).then(function(arr2){
        return arr2.filter(function(v){
            return v;
        });
    });
}
module.exports = filter;