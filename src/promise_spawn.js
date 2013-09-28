var PromiseSpawn = (function() {

var haveEs6Generators = (function(){
    try {
        /* jshint nonew: false */
        new Function("(function*(){})");
        return true;
    }
    catch(e) {
        return false;
    }
})();

function PromiseSpawn( generatorFunction, receiver, caller ) {
    this._resolver = Promise.pending( caller );
    this._generatorFunction = generatorFunction;
    this._receiver = receiver;
    this._generator = void 0;
}
var method = PromiseSpawn.prototype;

method.promise = function PromiseSpawn$promise() {
    return this._resolver.promise;
};

method._run = function PromiseSpawn$_run() {
    this._generator = this._generatorFunction.call( this._receiver );
    this._receiver =
        this._generatorFunction = void 0;
    this._next( void 0 );
};

method._continue = function PromiseSpawn$_continue( result ) {
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
        Promise.cast( value )._then(
            this._next,
            this._throw,
            void 0,
            this,
            null,
            void 0
        );
    }
};

method._throw = function PromiseSpawn$_throw( reason ) {
    this._continue(
        tryCatch1( this._generator["throw"], this._generator, reason )
    );
};

method._next = function PromiseSpawn$_next( value ) {
    this._continue(
        tryCatch1( this._generator.next, this._generator, value )
    );
};


PromiseSpawn.isSupported =
    new Function("return " + (haveEs6Generators));



return PromiseSpawn;})();