function quickMap(arr,func){
    var len = arr.length;
    if(!len){
        return [];
    }
 var i = -1;
 var out = new Array(len);
 if(typeof func === 'function'){
     while(++i<len){
         out[i]=func(arr[i],i);
     }
 }else{
    while(++i<len){
        out[i]=arr[i];
    }
 }
 return out;
}
module.exports = quickMap;
