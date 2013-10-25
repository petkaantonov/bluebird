"use strict";
module.exports = (function(){
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
        typeof navigator !== "undefined" && navigator !== null &&
        typeof navigator.appName === "string" ) {
        return window;
    }
})();
