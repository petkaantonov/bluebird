var apply = require('lie-apply');
var each = require('lie-quickeach');
function lfold(array,func,acc){
        var accum = acc;
        each(array,function(value){
            if(typeof accum === 'undefined'){
                accum = value;
            }else{
                accum = apply(func,accum,value);
            }
        });
        return accum;
}
module.exports = function(array,func,accumulator){
    return apply(lfold,array,func,accumulator);
};
