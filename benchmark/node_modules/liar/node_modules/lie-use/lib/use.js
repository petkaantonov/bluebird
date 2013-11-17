function use(thing,func){
    if(typeof thing.then === 'function'){
        return thing.then(func);
    }else{
        return func(thing);
    }
}
module.exports = use;