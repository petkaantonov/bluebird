function runAll() {
    asyncTest("When a handler is queued with immediate, it executes eventually", 1, function () {
        immediate(function () {
            ok(true, "The handler is called eventually.");
            start();
        });
    });

    asyncTest("When a handler is queued with immediate, it yields so that subsequent code executes first", 2, function () {
        var handlerCalled = false;
        function handler() {
            handlerCalled = true;

            ok(true, "The handler is called eventually.");
            start();
        }

        immediate(handler);
        ok(!handlerCalled, "Simply calling immediate does not call the handler immediately.");
    });

    asyncTest("When given the handler and one argument, immediate calls the handler with that argument", 1, function () {
        var expectedArg = {};

        function handler(actualArg) {
            strictEqual(actualArg, expectedArg, "The argument passed to the handler is the same object as was passed to immediate as the second argument.");
            start();
        }

        immediate(handler, expectedArg);
    });

    asyncTest("When given the handler and two arguments, immediate calls the handler with those arguments", 2, function () {
        var expectedArg1 = {};
        var expectedArg2 = {};

        function handler(actualArg1, actualArg2) {
            strictEqual(actualArg1, expectedArg1, "The first argument passed to the handler is the same object as was passed to immediate as the second argument.");
            strictEqual(actualArg2, expectedArg2, "The second argument passed to the handler is the same object as was passed to immediate as the third argument.");
            start();
        }

        immediate(handler, expectedArg1, expectedArg2);
    });

    asyncTest("When immediate is called, calling clearImmediate on the next line prevents the handler from being called (at least for within the next second)", 1, function () {
        var handlerCalled = false;
        function handler() {
            handlerCalled = true;
        }

        var handle = immediate(handler);
        immediate.clear(handle);

        setTimeout(function () {
            ok(!handlerCalled, "After one second, the handler has not been not called.");
            start();
        }, 1000);
    });

    asyncTest("When multiple handlers are queued with immediate, calling clearImmediate on some of the handles clears those tasks but no others", 1, function () {
        var expectedArgs = ["A", "D"];
        var recordedArgs = [];
        function handler(arg) {
            recordedArgs.push(arg);
        }

        immediate(handler, "A");
        immediate.clear(immediate(handler, "B"));
        var handle = immediate(handler, "C");
        immediate(handler, "D");
        immediate.clear(handle);

        setTimeout(function () {
            deepEqual(recordedArgs, expectedArgs, "Only the non-cleared invocations of the handler occurr.");
            start();
        }, 1000);
    });

    asyncTest("When the handler launches a modal dialog, any subsequently queued handlers are not called until after the modal dialog closes", 1, function () {
        // Try to launch the less-annoying self-closing-window modal dialog; if that's not an option, fall back to alert.
        var showTheDialog = window.showModalDialog
            ? function () { window.showModalDialog("selfClose.htm") }
            : function () { window.alert("Please press OK to continue the test; we needed a modal dialog."); }

        var dialogClosed = false;
        immediate(function () {
            showTheDialog();
            dialogClosed = true;
        });

        immediate(function () {
            ok(dialogClosed, "The dialog closes before the subsequent immediate handler is called.");
            start();
        });
    });

    if (typeof Worker === "function") {
        asyncTest("When inside a web worker context, immediate calls the passed handler", 1, function () {
            var worker = new Worker("worker.js");
            worker.addEventListener("message", function (event) {
                strictEqual(event.data, "TEST", "The web worker's invocation of immediate executes the passed handler, passing data back to the main script.");
                start();
            }, false);
        });
    }
}
