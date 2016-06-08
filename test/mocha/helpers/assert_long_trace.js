var assert = require("assert");

function assertLongTrace(error, expectedJumpCount, expectedFramesForJumpsMap) {
    var envFramePattern = /(?:\(node.js:|\(module.js:|\(timers.js:|\bcheckTimers\b|\bdrainQueue\b|\btimerLoop\b|\b_onImmediate\b|\b_immediateCallback\b)/;
    var stack = error.stack.split("\n");
    var frameLinePattern = /(^\s+at|@|\s+\(No stack trace\))/;
    var previousEventPattern = /^From previous event/;
    var firstLine;
    for (var i = 0; i < stack.length; ++i) {
        if (previousEventPattern.test(stack[i])) {
            throw new Error("From previous event before any frames");
        }
        if (frameLinePattern.test(stack[i])) {
            firstLine = i - 1;
            break;
        }
    }
    var prev = stack[firstLine - 1];
    var jumpCount = 1;
    var jumpIndex = 0;
    var currentJumpFramesCount = 0;
    var envFramesCount = 0;
    for (var i = firstLine; i < stack.length; ++i) {
        var line = stack[i];
        if (previousEventPattern.test(line)) {
            var jumpContainsOnlyEnvFrames =
                currentJumpFramesCount === 0 && envFramesCount > 0;
            if (!jumpContainsOnlyEnvFrames) {
                if (previousEventPattern.test(prev)) {
                    throw new Error("2 consecutive From previous events");
                }
                if (jumpIndex < expectedFramesForJumpsMap.length) {
                    var expectedFrames = expectedFramesForJumpsMap[jumpIndex];
                    var expectedMessage = typeof expectedFrames === "number"
                        ? (expectedFrames + "")
                        : (expectedFrames[0] + "-" + expectedFrames[1]);
                    var message = "Expected " + (jumpIndex+1) + "th jump to contain " +
                        expectedMessage + " frames " +
                        "but it contains " + currentJumpFramesCount + " frames";
                    if (typeof expectedFrames === "number") {
                        assert(expectedFrames === currentJumpFramesCount, message);
                    } else {
                        assert(expectedFrames[0] <= currentJumpFramesCount &&
                               currentJumpFramesCount <= expectedFrames[1],
                               message);
                    }
                }
                jumpCount++;
                jumpIndex++;
            }
            currentJumpFramesCount = 0;
            envFramesCount = 0;
        } else if (frameLinePattern.test(line)) {
            if (envFramePattern.test(line)) {
                envFramesCount++;
            } else {
                currentJumpFramesCount++;
            }
        }
        prev = line;
    }
    assert.strictEqual(
        previousEventPattern.test(stack[stack.length - 1]), false,
        "The last line cannot be 'From previous event:'");
    if (typeof expectedJumpCount === "number") {
        assert.strictEqual(expectedJumpCount, jumpCount, "Expected " +
            expectedJumpCount + " jumps but saw " + jumpCount + " jumps");
    } else {
        assert(expectedJumpCount[0] <= jumpCount &&
            jumpCount <= expectedJumpCount[1],
            "Expected " +
            expectedJumpCount[0] + "-" + expectedJumpCount[1] +
            " jumps but saw " + jumpCount + " jumps"
        );
    }

    if (jumpCount > (expectedFramesForJumpsMap.length + 1)) {
        throw new Error("All jumps except the last one require an "+
            "expected frame count. " +
            "Got expected frame counts for only " +
            expectedFramesForJumpsMap.length + " while " + (jumpCount-1) +
            " was expected");
    }

}
module.exports = assertLongTrace;
