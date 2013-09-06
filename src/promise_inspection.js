var PromiseInspection = (function() {

//Based on
//https://github.com/promises-aplus/synchronous-inspection-spec/issues/6

//Not exactly like that spec because optional properties are like kryptonite
//whereas calls to short functions don't have any penalty and are just
//easier to use than properties (error on mistyping for example).
function PromiseInspection( promise ) {
    this._isResolved = promise.isResolved();
    this._isFulfilled = promise.isFulfilled();
    this._isRejected = promise.isRejected();

    this._resolvedValue = promise.isResolved()
        ? promise._resolvedValue
        //Don't reference values that will never be
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
    return this._isFulfilled;
};

/**
 * See if the underlying promise was rejected at the creation time of this
 * inspection object.
 *
 * @return {boolean}
 */
method.isRejected = function() {
    return this._isRejected;
};

/**
 * Get the fulfillment value of the underlying promise. Throws
 * if the promise wasn't fulfilled at the creation time of this
 * inspection object.
 *
 * @return {dynamic}
 * @throws {TypeError}
 */
method.fulfillmentValue = function() {
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
method.rejectionReason = function() {
    if( !this.isRejected() ) {
        throw new TypeError(
            "cannot get rejection reason of a non-rejected promise");
    }
    return this._resolvedValue;
};




return PromiseInspection;})();
