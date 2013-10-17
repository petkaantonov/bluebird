if( typeof module !== "undefined" && module.exports ) {
    module.exports = Promise;
}
else if( typeof define === "function" && define.amd ) {
    define(function(){return Promise;});
}
else {
    global.Promise = Promise;
}


return Promise;})(
    //shims for new Function("return this")()
    //wihch cannot be used in e.g. extensions
    (function(){
        //Not in strict mode
        if( typeof this !== "undefined" ) {
            return this;
        }
        //Strict mode, node
        if( typeof process !== "undefined" &&
            typeof global !== "undefined" &&
            typeof process.execPath === "string" ) {
            return global;
        }
        //Strict mode, browser
        if( typeof window !== "undefined" &&
            typeof document !== "undefined" &&
            typeof navigator !== "undefined" && navigator !== null &&
            typeof navigator.appName === "string" ) {
            return window;
        }
    })(),
    Function,
    Array,
    Error,
    Object
);
