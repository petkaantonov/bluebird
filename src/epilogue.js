if( typeof module !== "undefined" && module.exports ) {
    module.exports = Promise;
}
else if( typeof define === "function" && define.amd ) {
    define( "Promise", [], function(){return Promise;});
}
else {
    global.Promise = Promise;
}


return Promise;})(
    (function(){
        //shims for new Function("return this")()
        if( typeof this !== "undefined" ) {
            return this;
        }
        if( typeof process !== "undefined" &&
            typeof global !== "undefined" &&
            typeof process.execPath === "string" ) {
            return global;
        }
        if( typeof window !== "undefined" &&
            typeof document !== "undefined" &&
            document.defaultView === window ) {
            return window;
        }
    })(),
    Function,
    Array,
    Error,
    Object
);