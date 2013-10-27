"use strict";
module.exports = function( Promise, Promise$_All, PromiseArray ) {

    var AnyPromiseArray = require( "./any_promise_array.js" )(PromiseArray);

    function Promise$_Any( promises, useBound, caller ) {
        return Promise$_All(
            promises,
            AnyPromiseArray,
            caller,
            useBound === USE_BOUND ? promises._boundTo : void 0
        ).promise();
    }

    Promise.any = function Promise$Any( promises ) {
        return Promise$_Any( promises, DONT_USE_BOUND, Promise.any );
    };

    Promise.prototype.any = function Promise$any() {
        return Promise$_Any( this, USE_BOUND, this.any );
    };

};
