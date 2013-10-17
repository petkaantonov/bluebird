if( typeof module !== "undefined" && module.exports ) {
    module.exports = Promise;
}
else if( typeof define === "function" && define.amd ) {
    define(function(){return Promise;});
}
else {
    global.Promise = Promise;
}

// Enable long stack traces in node when env.BLUEBIRD_DEBUG is defined

if (typeof(process) !== "undefined"
    && typeof(process.execPath) === "string"
    && typeof(process.env) === "object"
    && process.env["BLUEBIRD_DEBUG"]) Promise.longStackTraces();

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
