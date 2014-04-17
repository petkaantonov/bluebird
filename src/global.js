module.exports = (function() {
    if (this !== void 0) return this; //nonstrict mode
    try {return global;} // node
    catch(e) {}
    try {
        // firefox extension, strict mode
        if(window.wrappedJSObject !== void 0) return window.wrappedJSObject; 
        return window; // browser
    }
    catch(e) {}
    try {return self;}
    catch(e) {}
})();
