var PromiseSpawn = (function() {

function PromiseSpawn( generatorFunction, receiver, caller ) {
    this._resolver = Promise.pending( caller );
    this._generatorFunction = generatorFunction;
    this._receiver = receiver;
    this._generator = void 0;
}

PromiseSpawn.prototype.promise = function PromiseSpawn$promise() {
    return this._resolver.promise;
};

PromiseSpawn.prototype._run = function PromiseSpawn$_run() {
    this._generator = this._generatorFunction.call( this._receiver );
    this._receiver =
        this._generatorFunction = void 0;
    this._next( void 0 );
};

PromiseSpawn.prototype._continue = function PromiseSpawn$_continue( result ) {
    if( result === errorObj ) {
        this._generator = void 0;
        this._resolver.reject( result.e );
        return;
    }

    var value = result.value;
    if( result.done === true ) {
        this._generator = void 0;
        this._resolver.fulfill( value );
    }
    else {
        var ret = Promise._cast( value, PromiseSpawn$_continue );
        if( !( ret instanceof Promise ) ) {
            this._throw( new TypeError(
                "A value was yielded that could not be treated as a promise"
            ) );
            return;
        }
        ret._then(
            this._next,
            this._throw,
            void 0,
            this,
            //Don't need to smuggle null but doing so
            //triggers many fast paths
            null,
            void 0
        );
    }
};

PromiseSpawn.prototype._throw = function PromiseSpawn$_throw( reason ) {
    this.promise()._attachExtraTrace( reason );
    this._continue(
        tryCatch1( this._generator["throw"], this._generator, reason )
    );
};

PromiseSpawn.prototype._next = function PromiseSpawn$_next( value ) {
    this._continue(
        tryCatch1( this._generator.next, this._generator, value )
    );
};

return PromiseSpawn;})();
