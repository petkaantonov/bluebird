"use strict";
module.exports = function(Promise, apiRejection, INTERNAL) {
    var PromiseSpawn = require("./promise_spawn.js")(Promise, INTERNAL);
    var errors = require("./errors.js");
    var TypeError = errors.TypeError;
    var deprecated = require("./util.js").deprecated;

    Promise.coroutine = function Promise$Coroutine(generatorFunction) {
        //Throw synchronously because Promise.coroutine is semantically
        //something you call at "compile time" to annotate static functions
        if (typeof generatorFunction !== "function") {
            throw new TypeError(NOT_GENERATOR_ERROR);
        }
        //(TODO) Check if v8 traverses the contexts or inlines the context slot
        //location depending on this
        var PromiseSpawn$ = PromiseSpawn;
        return function anonymous() {
            var generator = generatorFunction.apply(this, arguments);
            var spawn = new PromiseSpawn$(void 0, void 0, anonymous);
            spawn._generator = generator;
            spawn._next(void 0);
            return spawn.promise();
        };
    };

    Promise.coroutine.addYieldHandler = PromiseSpawn.addYieldHandler;

    Promise.spawn = function Promise$Spawn(generatorFunction) {
        deprecated(SPAWN_DEPRECATED);
        //Return rejected promise because Promise.spawn is semantically
        //something that will be called at runtime with possibly dynamic values
        if (typeof generatorFunction !== "function") {
            return apiRejection(NOT_GENERATOR_ERROR);
        }
        var spawn = new PromiseSpawn(generatorFunction, this, Promise.spawn);
        var ret = spawn.promise();
        spawn._run(Promise.spawn);
        return ret;
    };
};
