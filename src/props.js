"use strict";
module.exports = function( Promise ) {
    var PropertiesPromiseArray = require( "./properties_promise_array.js" );
    var util = require( "./util.js" );
    var isPrimitive = util.isPrimitive;

    function Promise$_Props( promises, useBound, caller ) {
        var ret;
        if( isPrimitive( promises ) ) {
            ret = Promise.fulfilled( promises, caller );
        }
        else if( Promise.is( promises ) ) {
            ret = promises._then( Promise.props, void 0, void 0,
                            void 0, void 0, caller );
        }
        else {
            ret = new PropertiesPromiseArray(
                promises,
                caller,
                useBound === USE_BOUND ? promises._boundTo : void 0
            ).promise();
            //The constructor took care of it
            useBound = DONT_USE_BOUND;
        }
        if( useBound === USE_BOUND ) {
            ret._boundTo = promises._boundTo;
        }
        return ret;
    }

    Promise.prototype.props = function Promise$props() {
        return Promise$_Props( this, USE_BOUND, this.props );
    };

    Promise.props = function Promise$Props( promises ) {
        return Promise$_Props( promises, DONT_USE_BOUND, Promise.props );
    };
};


