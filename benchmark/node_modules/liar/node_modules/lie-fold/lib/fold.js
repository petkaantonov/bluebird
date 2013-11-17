var some = require('lie-some');
var apply = require('lie-apply');
var each = require('lie-quickeach');
function fold(array,func,acc){
    return some(array).then(function(a){
            var accum = acc;
            each(a,function(value){
                if(typeof accum === 'undefined'){
                    accum = value;
                }else{
                    accum = apply(func,accum,value);
                }
            });
            return accum;
        });
}
module.exports = fold;