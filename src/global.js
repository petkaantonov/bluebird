"use strict";
module.exports = (function(){
    //Not in strict mode
    if (typeof this !== "undefined") {
        return this;
    }
    //Strict mode, node
    if (typeof process !== "undefined" &&
        typeof global !== "undefined" &&
        typeof process.execPath === "string") {
        return global;
    }
    //Strict mode, browser
    if (typeof window !== "undefined" &&
        typeof document !== "undefined" &&
        typeof navigator !== "undefined" && navigator !== null &&
        typeof navigator.appName === "string") {
            //Strict mode, Firefox extension
            if(window.wrappedJSObject !== undefined){
                return window.wrappedJSObject;
            }
        return window;
    }
})();
