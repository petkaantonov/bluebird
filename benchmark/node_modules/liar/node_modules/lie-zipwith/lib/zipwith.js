var map = require('lie-map');
var qMap = require('lie-quickmap');
var each = require('lie-quickeach');
var all = require('lie-all');
function zipwith(){
        if(arguments.length===2){
            return map(arguments[1],arguments[0]);
        }
        return all(qMap(arguments)).then(function(args){
            var func = args.shift();
            var min = args[0].length;
            var shortest = 0;
            each(args,function(a,i){
                var len = a.length;
                if(len<min){
                    shortest = i;
                    min = len;
                }
            });
            return map(args[shortest],function(_,i){
                return map(args,function(value){
                    return value[i];
                }).then(function(values){
                    return func.apply(null,values);
                });
            });
        });
}
module.exports = zipwith;
