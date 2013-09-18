var Thenable = (function() {

//Pending promises are not garbage collected anyway
//so this works as a weak map as addition and deletion
//are all done from internal code

//(TODO) Perf is already pretty bad if one insists on using
//non-real promises so instead of using funky expando property
//should use identity array with O(N) lookup
function Thenable() {
    this.errorObj = errorObj;
    this.__id__ = 0;
    this.treshold = 1000;
    this.thenableCache = new Array( this.treshold );
    this.promiseCache = new Array( this.treshold );
    this._compactQueued = false;
}
var method = Thenable.prototype;

method.is = function Thenable$is( ret, ref ) {
    //Do try catching since retrieving non-existent
    //properties slows down anyway
    try {
        //Retrieving the property may throw
        var id = ret.__id_$thenable__;
        if( typeof id === "number" &&
            this.thenableCache[id] !== void 0 ) {
            ref.ref = this.thenableCache[id];
            ref.promise = this.promiseCache[id];
            return true;
        }
        var then = ret.then;
        if( typeof then === "function" ) {
            //Faking a reference so that the
            //caller may read the retrieved value
            //since reading .then again might
            //return something different

            ref.ref = then;
            return true;
        }
        return false;
    }
    catch(e) {
        this.errorObj.e = e;
        ref.ref = this.errorObj;
        //This idiosyncrasy is because of how the
        //caller code is currently layed out..
        return true;
    }
};

method.addCache = function Thenable$_addCache( thenable, promise ) {
    var id = this.__id__;
    this.__id__ = id + 1;
    var descriptor = this._descriptor( id );
    Object.defineProperty( thenable, "__id_$thenable__", descriptor );
    this.thenableCache[id] = thenable;
    this.promiseCache[id] = promise;
    ASSERT( this.thenableCache[ thenable.__id_$thenable__ ] === thenable );
    if( this.thenableCache.length > this.treshold &&
        !this._compactQueued) {
        this._compactQueued = true;
        async.invokeLater( this._compactCache, this, void 0 );
    }
};

method.deleteCache = function Thenable$deleteCache( thenable ) {
    var id = thenable.__id_$thenable__;
    ASSERT( typeof id === "number" );
    ASSERT( (id | 0) === id );
    if( id === -1 ) {
        return;
    }
    ASSERT( id > -1 );
    ASSERT( id < this.__id__ );
    ASSERT( this.thenableCache[id] === thenable );
    this.thenableCache[id] = void 0;
    this.promiseCache[id] = void 0;
    thenable.__id_$thenable__ = -1; //dont delete the property
};

var descriptor = {
    value: 0,
    enumerable: false,
    writable: true,
    configurable: true
};
method._descriptor = function Thenable$_descriptor( id ) {
    descriptor.value = id;
    return descriptor;
};

method._compactCache = function Thenable$_compactCache() {
    var arr = this.thenableCache;
    var promiseArr = this.promiseCache;
    var skips = 0;
    var j = 0;
    for( var i = 0, len = arr.length; i < len; ++i ) {
        var item = arr[ i ];
        if( item === void 0 ) {
            skips++;
        }
        else {
            promiseArr[ j ] = promiseArr[ i ];
            item.__id_$thenable__ = j;
            arr[ j++ ] = item;
        }
    }
    var newId = arr.length - skips;
    if( newId === this.__id__ ) {
        this.treshold *= 2;
    }
    else for( var i = newId, len = arr.length; i < len; ++i ) {
        promiseArr[ j ] = arr[i] = void 0;
    }

    this.__id__ = newId;
    this._compactQueued = false;
};




return Thenable;})();