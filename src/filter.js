"use strict";
module.exports = function( Promise, Promise$_All ) {

    var errors = require( "./errors.js");
    var apiRejection = errors.apiRejection;
    var PromiseArray = require( "./promise_array.js" );
    var ASSERT = require( "./assert.js" );

    function Promise$_filterer( fulfilleds ) {
        var fn = this;
        var receiver = void 0;
        if( typeof fn !== "function" )  {
            receiver = fn.receiver;
            fn = fn.fn;
        }
        ASSERT( typeof fn === "function" );
        var ret = new Array( fulfilleds.length );
        var j = 0;
        if( receiver === void 0 ) {
             for( var i = 0, len = fulfilleds.length; i < len; ++i ) {
                var item = fulfilleds[i];
                if( item === void 0 &&
                    !( i in fulfilleds ) ) {
                    continue;
                }
                if( fn( item, i, len ) ) {
                    ret[j++] = item;
                }
            }
        }
        else {
            for( var i = 0, len = fulfilleds.length; i < len; ++i ) {
                var item = fulfilleds[i];
                if( item === void 0 &&
                    !( i in fulfilleds ) ) {
                    continue;
                }
                if( fn.call( receiver, item, i, len ) ) {
                    ret[j++] = item;
                }
            }
        }
        ret.length = j;
        return ret;
    }

    function Promise$_Filter( promises, fn, useBound, caller ) {
        if( typeof fn !== "function" ) {
            return apiRejection( "fn is not a function" );
        }

        if( useBound === USE_BOUND ) {
            fn = {
                fn: fn,
                receiver: promises._boundTo
            };
        }

        return Promise$_All( promises, PromiseArray, caller,
                useBound === USE_BOUND ? promises._boundTo : void 0 )
            .promise()
            ._then( Promise$_filterer, void 0, void 0, fn, void 0, caller );
    }

    Promise.filter = function Promise$Filter( promises, fn ) {
        return Promise$_Filter( promises, fn, DONT_USE_BOUND, Promise.filter );
    };

    Promise.prototype.filter = function Promise$filter( fn ) {
        return Promise$_Filter( this, fn, USE_BOUND, this.filter );
    };
};
