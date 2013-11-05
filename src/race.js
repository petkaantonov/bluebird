"use strict";
module.exports = function( Promise, Promise$_All, PromiseArray ) {

    var RacePromiseArray =
        require( "./race_promise_array.js" )(Promise, PromiseArray);

    function Promise$_Race( promises, useBound, caller ) {
        return Promise$_All(
            promises,
            RacePromiseArray,
            caller,
            useBound === USE_BOUND ? promises._boundTo : void 0
        ).promise();
    }

    Promise.race = function Promise$Race( promises ) {
        return Promise$_Race( promises, DONT_USE_BOUND, Promise.race );
    };

    Promise.prototype.race = function Promise$race() {
        return Promise$_Race( this, USE_BOUND, this.race );
    };

};
