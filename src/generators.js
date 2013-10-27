"use strict";
module.exports = function( Promise ) {
    var PromiseSpawn = require( "./promise_spawn.js" );
    var errors = require( "./errors.js");
    var TypeError = errors.TypeError;
    var apiRejection = errors.apiRejection;

    Promise.coroutine = function Promise$Coroutine( generatorFunction ) {
         if( typeof generatorFunction !== "function" ) {
            throw new TypeError( "generatorFunction must be a function" );
        }
        //(TODO) Check if v8 traverses the contexts or inlines the context slot
        //location depending on this
        var PromiseSpawn$ = PromiseSpawn;
        return function anonymous() {
            var generator = generatorFunction.apply( this, arguments );
            var spawn = new PromiseSpawn$( void 0, void 0, anonymous );
            spawn._generator = generator;
            spawn._next( void 0 );
            return spawn.promise();
        };
    };

    Promise.spawn = function Promise$Spawn( generatorFunction ) {
        if( typeof generatorFunction !== "function" ) {
            return apiRejection( "generatorFunction must be a function" );
        }
        var spawn = new PromiseSpawn( generatorFunction, this, Promise.spawn );
        var ret = spawn.promise();
        spawn._run( Promise.spawn );
        return ret;
    };
};
