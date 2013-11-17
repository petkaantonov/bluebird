var map = require('lie-map');
var qMap = require('lie-quickmap');
var all = require('lie-all');
var each = require('lie-quickeach');
function zip(){
        if(arguments.length===1){
            return map(arguments[0],function(a){
                return [a];
            });
        }
        return all(qMap(arguments)).then(function(args){
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
                });
            });
        });
}
module.exports = zip;
