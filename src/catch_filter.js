var CatchFilter = (function() {

function CatchFilter( instances, callback ) {
    this._instances = instances;
    this._callback = callback;
}
CatchFilter.prototype.doFilter = function CatchFilter$doFilter( e ) {
    if( e === null || typeof e !== "object" ) {
        throw e;
    }
    var cb = this._callback;
    for( var i = 0, len = this._instances.length; i < len; ++i ) {
        var item = this._instances[i];
        if( e instanceof item ) {
            var ret = tryCatch1( cb, void 0, e );
            if( ret === errorObj ) {
                throw ret.e;
            }
            return ret;
        }
    }
    throw e;
};

return CatchFilter;})();
