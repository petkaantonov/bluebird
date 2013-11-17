

## Introduction

**immediate.js** is a cross between [NobleJS's setImmediate](https://github.com/NobleJS/setImmediate), [Cujo's When](https://github.com/cujojs/when), and [RSVP][RSVP].

immediate takes the tricks from setImmedate and RSVP and combines them with the schedualer from when to make a low latency polyfill.

## The Tricks

### `process.nextTick`

In Node.js versions below 0.9, `setImmediate` is not available, but [`process.nextTick`][nextTIck] is, so we use it to
shim support for a global `setImmediate`. In Node.js 0.9 and above, `setImmediate` is available.

Note that we check for *actual* Node.js environments, not emulated ones like those produced by browserify or similar.
Such emulated environments often already include a `process.nextTick` shim that's not as browser-compatible as
setImmediate.js.

### `MutationObserver`

This is what [RSVP][RSVP] uses, it's very fast, details on [MDN](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)

### `postMessage`

In Firefox 3+, Internet Explorer 9+, all modern WebKit browsers, and Opera 9.5+, [`postMessage`][postMessage] is
available and provides a good way to queue tasks on the event loop. It's quite the abuse, using a cross-document
messaging protocol within the same document simply to get access to the event loop task queue, but until there are
native implementations, this is the best option.

Note that Internet Explorer 8 includes a synchronous version of `postMessage`. We detect this, or any other such
synchronous implementation, and fall back to another trick.

### `MessageChannel`

Unfortunately, `postMessage` has completely different semantics inside web workers, and so cannot be used there. So we
turn to [`MessageChannel`][MessageChannel], which has worse browser support, but does work inside a web worker.

### `<script> onreadystatechange`

For our last trick, we pull something out to make things fast in Internet Explorer versions 6 through 8: namely,
creating a `<script>` element and firing our calls in its `onreadystatechange` event. This does execute in a future
turn of the event loop, and is also faster than `setTimeout(…, 0)`, so hey, why not?

## Usage

In the browser, include it with a `<script>` tag; pretty simple. Creates a global
called `immediate` which should act like setImmediate. It also has a method called
`clear` which should act like `clearImmediate`.

In Node.js, do

```
npm install immediate
```

then

```js
var immediate = require("immediate");
```

somewhere early in your app; it attaches to the global.

 
## Reference and Reading

 * [Efficient Script Yielding W3C Editor's Draft][spec]
 * [W3C mailing list post introducing the specification][list-post]
 * [IE Test Drive demo][ie-demo]
 * [Introductory blog post by Nicholas C. Zakas][ncz]
 * I wrote a couple blog pots on this, [part 1][my-blog-1] and [part 2][my-blog-2]

[RSVP]: https://github.com/tildeio/rsvp.js
[spec]: https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/setImmediate/Overview.html
[list-post]: http://lists.w3.org/Archives/Public/public-web-perf/2011Jun/0100.html
[ie-demo]: http://ie.microsoft.com/testdrive/Performance/setImmediateSorting/Default.html
[ncz]: http://www.nczonline.net/blog/2011/09/19/script-yielding-with-setimmediate/
[nextTick]: http://nodejs.org/docs/v0.8.16/api/process.html#process_process_nexttick_callback
[postMessage]: http://www.whatwg.org/specs/web-apps/current-work/multipage/web-messaging.html#posting-messages
[MessageChannel]: http://www.whatwg.org/specs/web-apps/current-work/multipage/web-messaging.html#channel-messaging
[cross-browser-demo]: http://calvinmetcalf.github.io/setImmediate-shim-demo
[my-blog-1]:http://calvinmetcalf.com/post/61672207151/setimmediate-etc
[my-blog-2]:http://calvinmetcalf.com/post/61761231881/javascript-schedulers