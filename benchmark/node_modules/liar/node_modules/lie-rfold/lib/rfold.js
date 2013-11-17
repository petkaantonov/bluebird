var apply = require('lie-apply');
var each = require('lie-quickeach');
function rfold(array,func,acc){
        var accum = acc;
        var len = array.length-1;
        each(array,function(_,i){
            var value = array[len-i];
            if(typeof accum === 'undefined'){
                accum = value;
            }else{
                accum = apply(func,accum,value);
            }
        });
        return accum;
}
module.exports = function(array,func,accumulator){
    return apply(rfold,array,func,accumulator);
};
