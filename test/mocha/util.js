"use strict";
var assert = require("assert");
var util = require("../../js/debug/util");


describe("utilities", function() {

    var hookExtension = function() {
        hookExtension.executedFlag = true;
    };

    var hookExtension1 = function() {
        hookExtension1.executedFlag = true;
    };

    beforeEach(function () {
        if (Promise.prototype.hook) delete Promise.prototype.hook;
        hookExtension.executedFlag = false;
        hookExtension1.executedFlag = false;
    });

    it("hookTo function adds handler to a hook", function() {
        util.hookTo(Promise.prototype,"hook", hookExtension);
        var promise = new Promise(function (){});
        assert (promise.hook.extensions[hookExtension._hookExtensionId].executedFlag === false);
        promise.hook();
        assert (promise.hook.extensions[hookExtension._hookExtensionId].executedFlag === true);
    });

    it("hookTo function adds 2 handlers to a hook", function() {
        util.hookTo(Promise.prototype,"hook", hookExtension);
        util.hookTo(Promise.prototype,"hook", hookExtension1);
        var promise = new Promise(function (){});
        assert (promise.hook.extensions[hookExtension._hookExtensionId].executedFlag === false);
        assert (promise.hook.extensions[hookExtension1._hookExtensionId].executedFlag === false);
        promise.hook();
        assert (promise.hook.extensions[hookExtension._hookExtensionId].executedFlag === true);
        assert (promise.hook.extensions[hookExtension1._hookExtensionId].executedFlag === true);
    });

    it("unhookFrom function removes handler from a hook", function() {
        util.hookTo(Promise.prototype,"hook", hookExtension);
        util.unhookFrom(Promise.prototype,"hook", hookExtension);
        var promise = new Promise(function (){});
        assert(typeof Promise.prototype["hook"].extensions[
                hookExtension.toString()] === "undefined");
        assert(typeof promise.hook.extensions[hookExtension._hookExtensionId] === "undefined");
    });

    after(function () {
        delete Promise.prototype.hook;
    });
});
