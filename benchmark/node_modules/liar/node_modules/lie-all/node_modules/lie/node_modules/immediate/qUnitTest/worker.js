importScripts("../dist/immediate.js");

immediate(function () {
	self.postMessage("TEST");
});