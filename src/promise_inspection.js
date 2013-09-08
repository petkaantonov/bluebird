var PromiseInspection = (function() {


//Based on
//https://github.com/promises-aplus/synchronous-inspection-spec/issues/6

//Not exactly like that spec because optional properties are like kryptonite
//whereas calls to short functions don't have any penalty and are just
//easier to use than properties (error on mistyping for example).
function PromiseInspection( promise ) {
    this._bitField = promise._bitField;
    this._resolvedValue = promise.isResolved()
        ? promise._resolvedValue
        //Don't keep a reference to something that will never be
        //used
        : void 0;
}
var method = PromiseInspection.prototype;

/**
 * See if the underlying promise was fulfilled at the creation time of this
 * inspection object.
 *
 * @return {boolean}
 */
method.isFulfilled = function() {
    return ( this._bitField & IS_FULFILLED ) > 0;
};

/**
 * See if the underlying promise was rejected at the creation time of this
 * inspection object.
 *
 * @return {boolean}
 */
method.isRejected = function() {
    return ( this._bitField & IS_REJECTED ) > 0;
};

/**
 * See if the underlying promise was pending at the creation time of this
 * inspection object.
 *
 * @return {boolean}
 */
method.isPending = function() {
    return ( this._bitField & IS_REJECTED_OR_FULFILLED ) === 0;
};

/**
 * Get the fulfillment value of the underlying promise. Throws
 * if the promise wasn't fulfilled at the creation time of this
 * inspection object.
 *
 * @return {dynamic}
 * @throws {TypeError}
 */
method.value = function() {
    if( !this.isFulfilled() ) {
        throw new TypeError(
            "cannot get fulfillment value of a non-fulfilled promise");
    }
    return this._resolvedValue;
};

/**
 * Get the rejection reason for the underlying promise. Throws
 * if the promise wasn't rejected at the creation time of this
 * inspection object.
 *
 * @return {dynamic}
 * @throws {TypeError}
 */
method.error = function() {
    if( !this.isRejected() ) {
        throw new TypeError(
            "cannot get rejection reason of a non-rejected promise");
    }
    return this._resolvedValue;
};




return PromiseInspection;})();
