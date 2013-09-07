var PromiseArray = (function() {
    var method = PromiseArray.prototype;


    /**
     * Description.
     *
     *
     */
    function PromiseArray( values ) {
        this._values = values;
        this._resolver = Promise.pending();
        this._length = values.length;
        this._totalResolved = 0;
        //keep the constructor body short
        this._init();
    }

    method.promise = function() {
        return this._resolver.promise;
    };

    method._init = function() {
        var values = this._values;
        for( var i = 0, len = values.length; i < len; ++i ) {
            var promise = values[i];
            if( !(promise instanceof Promise) ) {
                promise = Promise.fulfilled( promise );
            }
            promise._then(
                this._promiseFulfilled,
                this._promiseRejected,

                void 0,
                this,
                i //Smuggle the index as internal data
                  //to avoid creating closures in this loop

                  //Will not chain so creating one
                  //would be a waste anyway

            );
        }
    };

    method._fulfill = function( value ) {
        this._resolver.fulfill( value );
    };

    method._reject = function( reason ) {
        this._resolver.reject( reason );
    };

    method._promiseFulfilled = function( value, index ) {
        if( this.promise().isResolved() ) return;
        //(TODO) could fire a progress when a promise is completed
        this._values[ index ] = value;
        var totalResolved = this._totalResolved;
        if( totalResolved >= this._length - 1 ) {
            this._fulfill( this._values );
        }
        this._totalResolved = totalResolved + 1;
    };

    method._promiseRejected = function( reason ) {
        if( this.promise().isResolved() ) return;
        this._totalResolved++;
        this._reject( reason );
    };

    return PromiseArray;
})();
