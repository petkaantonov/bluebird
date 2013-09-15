var ContextStack = (function() {
var method = ContextStack.prototype;

function ContextStack() {
    this._longStackTraces = __DEBUG__;
    this._stack = new Array( 50 );
    for( var i = 0, len = this._stack.length; i < len; ++i ) {
        this._stack[i] = void 0;
    }
    this._length = 0;
}

method.push = function ContextStack$push( promise ) {
    if( !this._longStackTraces ) return;
    ASSERT( promise instanceof Promise );
    if( this._length >= this._stack.length ) {
        this._stack.push( promise );
    }
    else {
        this._stack[this._length] = promise;
    }
    this._length++;
};

method.pop = function ContextStack$pop() {
    if( !this._longStackTraces ) return;
    ASSERT( this.length() > 0 );
    this._length--;
    this._stack[ this._length ] = void 0;
};

method.context = function ContextStack$context() {
    if( !this._longStackTraces ||
        this.length() === 0 ) return void 0;
    var ret = this._stack[ this.length() - 1 ];
    ASSERT( ret instanceof Promise );
    return ret;
};

method.length = function ContextStack$length() {
    return this._length;
};

method.setLongStackTraces = function ContextStack$setLongStackTraces( val ) {
    this._longStackTraces = val;
};

return ContextStack;})();

var contextStack = new ContextStack();