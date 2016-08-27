self.importScripts("./worker_bundle.js");

var currentPromise;

function handler(ev) {
    ev.preventDefault();
    self.postMessage(ev.type);
    if (ev.type === "unhandledrejection") {
        currentPromise.catch(function () {});
    }
}

self.addEventListener("unhandledrejection", handler);
self.addEventListener("rejectionhandled", handler);

self.onmessage = function onmessage(ev) {
    if (ev.data === "reject") {
        currentPromise = Promise.reject(new Error("rejected"));
    }
};
