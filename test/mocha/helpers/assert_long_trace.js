var assert = require("assert");

function assertLongTrace(error, expectedJumpCount, expectedFramesForJumpsMap) {
    var envFramePattern = /(?:\(node.js:|\(module.js:)/;
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
    for (var i = firstLine; i < stack.length; ++i) {
        var line = stack[i];
        if (previousEventPattern.test(line)) {
            if (previousEventPattern.test(prev)) {
                throw new Error("2 consecutive From previous events");
            }
            if (jumpIndex < expectedFramesForJumpsMap.length) {
                assert.strictEqual(expectedFramesForJumpsMap[jumpIndex],
                    currentJumpFramesCount,
                    "Expected " + (jumpIndex+1) + "nth jump to contain" +
                    expectedFramesForJumpsMap[jumpIndex] + " frames " +
                    "but it contains " + currentJumpFramesCount + " frames");
            }
            jumpCount++;
            jumpIndex++;
            currentJumpFramesCount = 0;
        } else if (frameLinePattern.test(line) && !envFramePattern.test(line)) {
            currentJumpFramesCount++;
        }
        prev = line;
    }
    assert.strictEqual(
        previousEventPattern.test(stack[stack.length - 1]), false,
        "The last line cannot be 'From previous event:'");
    assert.strictEqual(expectedJumpCount, jumpCount, "Expected " +
        expectedJumpCount + " jumps but saw " + jumpCount + " jumps");

    if (jumpCount > (expectedFramesForJumpsMap.length + 1)) {
        throw new Error("All jumps except the last one require an "+
            "expected frame count. " +
            "Got expected frame counts for only " +
            expectedFramesForJumpsMap.length + " while " + (jumpCount-1) +
            " was expected");
    }

}
module.exports = assertLongTrace;
