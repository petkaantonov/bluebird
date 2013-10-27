"use strict";
module.exports = function( Promise, Promise$_All, PromiseArray, apiRejection ) {

    var ASSERT = require( "./assert.js" );

    function Promise$_mapper( fulfilleds ) {
        var fn = this;
        var receiver = void 0;

        if( typeof fn !== "function" )  {
            receiver = fn.receiver;
            fn = fn.fn;
        }
        ASSERT( typeof fn === "function" );
        var shouldDefer = false;

        if( receiver === void 0 ) {
            for( var i = 0, len = fulfilleds.length; i < len; ++i ) {
                if( fulfilleds[i] === void 0 &&
                    !(i in fulfilleds) ) {
                    continue;
                }
                var fulfill = fn( fulfilleds[ i ], i, len );
                if( !shouldDefer && Promise.is( fulfill ) ) {
                    if( fulfill.isFulfilled() ) {
                        fulfilleds[i] = fulfill._resolvedValue;
                        continue;
                    }
                    else {
                        shouldDefer = true;
                    }
                }
                fulfilleds[i] = fulfill;
            }
        }
        else {
            for( var i = 0, len = fulfilleds.length; i < len; ++i ) {
                if( fulfilleds[i] === void 0 &&
                    !(i in fulfilleds) ) {
                    continue;
                }
                var fulfill = fn.call( receiver, fulfilleds[ i ], i, len );
                if( !shouldDefer && Promise.is( fulfill ) ) {
                    if( fulfill.isFulfilled() ) {
                        fulfilleds[i] = fulfill._resolvedValue;
                        continue;
                    }
                    else {
                        shouldDefer = true;
                    }
                }
                fulfilleds[i] = fulfill;
            }
        }
        return shouldDefer
            ? Promise$_All( fulfilleds, PromiseArray,
                Promise$_mapper, void 0 ).promise()
            : fulfilleds;
    }

    function Promise$_Map( promises, fn, useBound, caller ) {
        if( typeof fn !== "function" ) {
            return apiRejection( "fn is not a function" );
        }

        if( useBound === USE_BOUND ) {
            fn = {
                fn: fn,
                receiver: promises._boundTo
            };
        }

        return Promise$_All(
            promises,
            PromiseArray,
            caller,
            useBound === USE_BOUND ? promises._boundTo : void 0
        ).promise()
        ._then(
            Promise$_mapper,
            void 0,
            void 0,
            fn,
            void 0,
            caller
        );
    }

    Promise.prototype.map = function Promise$map( fn ) {
        return Promise$_Map( this, fn, USE_BOUND, this.map );
    };

    Promise.map = function Promise$Map( promises, fn ) {
        return Promise$_Map( promises, fn, DONT_USE_BOUND, Promise.map );
    };
};
