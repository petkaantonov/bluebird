# Deferred
## Modular and fast Promises implementation for JavaScript

_Implementation originally inspired by Kris Kowal's [Q](https://github.com/kriskowal/q)_

Deferred is complete, __[one of the fastest](#performance)__ and natural promise implementation in JavaScript, with Deferred you can write __[clear maintainable code](#promises-approach)__ that takes maximum out of asynchronicity, in fact due to multi-dimensional nature of promises ( __[chaining](#chaining)__ and __[nesting](#nesting)__) you're forced to program declaratively.  

With Deferred you also can: __[Process collections](#processing-collections)__ of deferred calls. __[Handle Node.js asynchronous functions](#promisify---working-with-asynchronous-functions-as-we-know-them-from-nodejs)__. __[Limit concurrency](#limiting-concurrency)__ of scheduled tasks. __[Emit progress events](#progress-and-other-events)__ or __[stream results partially](#streaming-data-partially)__ on the go.  

In the end you may debug your flow by __[tracking unresolved promises](#monitoring-unresolved-promises)__ or gathering __[usage statistics](#usage-statistics)__.

_For good insight into promise/deferred concept and in general asynchronous programming see also slides from meetjs summit presentation: [Asynchronous JavaScript](http://www.medikoo.com/asynchronous-javascript/)_

__If you need help with deferred, please ask on dedicated mailing list: [deferred-js@googlegroups.com](https://groups.google.com/forum/#!forum/deferred-js)__

## Comparision with callback style

Let's take an example script that concatenates all JavaScript files in a given directory and saves it to lib.js.

### Plain Node.js, callbacks approach

```javascript
var fs = require('fs');

var readdir = fs.readdir;
var readFile = fs.readFile;
var writeFile = fs.writeFile;

// Read all filenames in given path
readdir(__dirname, function (err, files) {
	var result, waiting;
	if (err) {
		// if we're unable to get file listing throw error
		throw err;
	}

	// Filter *.js files and generated lib.js
	files = files.filter(function (file) {
		return (file.slice(-3) === '.js') && (file !== 'lib.js');
	});

	// Read content of each file
	waiting = 0;
	result = [];
	files.forEach(function (file, index) {
		++waiting;
		readFile(file, function (err, content) {
			if (err) {
				// We were not able to read file content, throw error
				throw err;
			}
			result[index] = content;

			if (!--waiting) {
				// Got content of all files
				// Concatenate into one string and write into lib.js
				writeFile(__dirname + '/lib.js', result.join("\n"), function (err) {
					if (err) {
						// We cannot write lib.js file, throw error
						throw err;
					}
				});
			}
		});
	});
});
```

### Implementation with promises:

```javascript
var promisify = require('deferred').promisify;
var fs = require('fs');

// Convert node.js async functions, into ones that return a promise
var readdir = promisify(fs.readdir);
var readFile = promisify(fs.readFile, 1); // Restrict arity to 1 + callback
var writeFile = promisify(fs.writeFile);

writeFile(__dirname + '/lib.js',
	// Read all filenames in given path
	readdir(__dirname)

	// Filter *.js files and generated lib.js
	.invoke('filter', function (file) {
		return (file.slice(-3) === '.js') && (file !== 'lib.js');
	})

	// Read content of all files
	.map(readFile)

	// Concatenate files content into one string
	.invoke('join', '\n')

).done(); // If there was any error on the way throw it
```

## Examples

See [examples folder](examples) for a demonstration of promises usage in some other real world cases.

## Installation

### NPM

In your project path:

	$ npm install deferred

### Browser

Browser bundle can be easily created with help of [modules-webmake](https://github.com/medikoo/modules-webmake). Assuming that you have latest [Node.js](http://nodejs.org/) and [Git](http://git-scm.com/) installed, following will work in command shell of any system (Linux/MacOS/Windows):

```
$ npm install -g webmake
$ git clone git://github.com/medikoo/deferred.git
$ cd deferred
$ npm install
$ cd ..
$ webmake --name=deferred deferred/lib/index.js deferred.js
```

Last command bundles deferred with all it's functionalities, but you may need just a subset, you can have that by addressing specific modules directly, e.g. with following you will build just core functionality with map extension:

```
$ webmake --name=deferred --include=deferred/lib/ext/promise/map.js deferred/lib/deferred.js deferred.js
```

If you work with AMD modules, use _amd_ option, so generated bundle is one:

```
$ webmake --amd deferred/lib/index.js deferred.js
```

To explicitly name AMD module pass _name_ option:

```
$ webmake --name=deferred --amd deferred/lib/index.js deferred.js
```



_Mind that deferred relies on some ECMAScript5 features, so for older browsers you need to load as well [es5-shim](https://github.com/kriskowal/es5-shim)_

## Deferred/Promise concept

### Deferred

For work that doesn't return immediately (asynchronous) you may create deferred object. Deferred holds both `resolve` and `promise` objects. Observers interested in value are attached to `promise` object, with `resolve` we resolve promise with an actual value. In common usage `promise` is returned to the world and `resolve` is kept internally

Let's create `delay` function decorator:

```javascript
var deferred = require('deferred');

var delay = function (fn, timeout) {
	return function () {
		var def = deferred(), self = this, args = arguments;

		setTimeout(function () {
			def.resolve(fn.apply(self, args));
		}, timeout);

		return def.promise;
	};
};

var delayedAdd = delay(function (a, b) {
	return a + b;
}, 100);

var resultPromise = delayedAdd(2, 3);

console.log(deferred.isPromise(resultPromise)); // true

resultPromise(function (value) {
	// Invoked after 100 milliseconds
	console.log(value); // 5
});
```

### Promise

Promise is an object that represents eventual value which may already be available or is expected to be available in a future. Promise may succeed (fulfillment) or fail (rejection). Promise can be resolved only once.  
In `deferred` (and most of the other promise implementations) you may listen for the value by passing observers to `then` function:

```javascript
promise.then(onsuccess, onfail);
```

In __deferred__ promise is really a `then` function, so you may use promise _function_ directly:

```javascript
promise === promise.then; // true
promise(onsuccess, onfail);
```

__If you want to keep clear visible distinction between promises and other object I encourage you to always use `promise.then` notation.__

Both callbacks `onsuccess` and `onfail` are optional. They will be called only once and only either `onsuccess` or `onfail` will be called.

#### Chaining

Promises by nature can be chained. `promise` function returns another promise which is resolved with a value returned by a callback function:

```javascript
delayedAdd(2, 3)(function (result) {
	return result * result
})(function (result) {
	console.log(result); // 25
});
```

It's not just functions that promise function can take, it can be other promises or any other JavaScript value (with exception of `null` or `undefined` which will be treated as no value). Going that way you may override result of a promise chain with specific value.

#### Nesting

Promises can be nested. If a promise resolves with another promise, it's not really resolved. It's resolved only when final promise is resolved with a real value:

```javascript
var def = deferred();
def.resolve(delayedAdd(2, 3)); // Resolve promise with another promise
def.promise(function (result) {
	console.log(5); // 5;
});
```

#### Error handling

Errors in promises are handled with separate control flow, that's one of the reasons why code written with promises is more readable and maintainable than when using callbacks approach.

A promise resolved with an error (rejected), propagates its error to all promises that depend on this promise (e.g. promises initiated by adding observers).  
If observer function crashes with error or returns error, its promise is rejected with the error.

To handle error, pass dedicated callback as second argument to promise function:

```javascript
delayedAdd(2, 3)(function (result) {
	throw new Error('Error!')
})(function () {
	// never called
}, function (e) {
	// handle error;
});
```

#### Ending chain

To expose the errors that are not handled, end promise chain with `.done()`, then error that broke the chain will be thrown:

```javascript
delayedAdd(2, 3)
(function (result) {
	throw new Error('Error!')
})(function (result) {
	// never executed
})
.done(); // throws error!
```

__It's important to end your promise chains with `done` otherwise eventual ignored errors will not be exposed__.  

Signature of `done` function is same as for `then` (or promise itself)

`done` is aliased with `end` function, however `end` will be removed with introduction of v0.7 release.

```javascript
promise(function (value) {
	// process
}).done(function (result) {
	// process result
}, function (err) {
	// handle error
});
```

And as with `then` either callback can be provided. If callback for error was omitted, eventual error will be thrown.

#### Creating resolved promises

You may create initially resolved promises.

```javascript
var promise = deferred(1);

promise(function (result) {
	console.log(result); // 1;
});
```

## Promisify - working with asynchronous functions as we know them from Node.js

There is a known convention (coined by Node.js) for working with asynchronous calls. An asynchronous function receives a callback argument which handles both eventual error and expected value:

```javascript
var fs = require('fs');

fs.readFile(__filename, 'utf-8', function (err, content) {
	if (err) {
		// handle error;
		return;
	}
	// process content
});
```

It's not convenient to work with both promises and callback style functions. When you decide to build your flow with promises __don't mix both concepts, just `promisify` asynchronous functions so they return promises instead__.

```javascript
var deferred = require('deferred')
	, fs = require('fs')

	, readFile = deferred.promisify(fs.readFile);

readFile(__filename, 'utf-8')(function (content) {
	// process content
}, function (err) {
	// handle error
});
```

`promisify` accepts also second argument, through which we may specify length of arguments that function takes (not counting callback argument), it may be handy if there's a chance that unexpected arguments will be passed to function (e.g. Array's `forEach` or `map`)

`promisify` also takes care of input arguments. __It makes sure that all arguments that are to be passed to asynchronous function are first resolved.__

## Grouping promises

When we're interested in results of more than one promise object we may group them into one promise with `deferred` function:

```javascript
deferred(delayedAdd(2, 3), delayedAdd(3, 5), delayedAdd(1, 7))(function (result) {
	console.log(result); // [5, 8, 8]
});
```

## Processing collections

### Map

It's analogous to Array's map, with that difference that it returns promise (of an array) that would be resolved when promises for all items are resolved. Any error that would occur will reject the promise and resolve it with same error.

In following example we take content of each file found in an array:

```javascript
var readFile = deferred.promisify(fs.readFile);

deferred.map(filenames, function (filename) {
	return readFile(filename, 'utf-8');
})(function (result) {
	// result is an array of file's contents
});
```

`map` is also available directly on a promise object, so we may invoke it directly on promise of a collection.

Let's try again previous example but this time instead of relying on already existing filenames, we take list of files from current directory:

```javascript
var readdir = deferred.promisify(fs.readdir);
var readFile = deferred.promisify(fs.readFile);

readdir(__dirname).map(function (filename) {
	return readFile(filename, 'utf-8');
})(function (result) {
	// result is an array of file's contents
});
```

This function is available also as an extension on promise object.

__See [limiting concurrency](#limiting-concurrency) section for info on how to limit maximum number of concurrent calls in `map`__

### Reduce

It's same as Array's reduce with that difference that it calls callback only after previous accumulated value is resolved, this way we may accumulate results of collection of promises or invoke some asynchronous tasks one after another.

```javascript
deferred.reduce([delayedAdd(2, 3), delayedAdd(3, 5), delayedAdd(1, 7)], function (a, b) {
	return delayedAdd(a, b);
})
(function (result) {
	console.log(result); // 21
});
```

This function is available also as an extension on promise object.

### Some

Promise aware Array's some. Process collection one after another and stop when first item matches your criteria

```javascript
deferred.some([filename1, filename2, filename3], function (a) {
	return readFile(filename, 'utf8', function (data) {
		if (data.indexOf('needle')) {
			// Got it! Stop further processing
			return true;
		}
	});
});
```

This function is available also as an extension on promise object.

## Limiting concurrency

There are cases when we don't want to run too many tasks simultaneously. Like common case in Node.js when we don't want to open too many file descriptors.

Handle that with `deferred.gate`:

```javascript
var fn = deferred.gate(function async() {
	var def = deferred();
	// ..
	return def.promise;
}, 10);
```

If there are already 10 concurrent tasks running `async` function invocation will be postponed into the queue and released when first of the running tasks will finish its job.

Additionally with third argument, we may limit number of postponed calls, so if there's more than _n_ of them rest is discarded. In below example, queue holds maximum 3 postponed calls, rest will be discarded.

```javascript
var fn = deferred.gate(function async() { .. }, 10, 3);
```

In following example we'll limit concurrent readFile calls when using deferred.map:

```javascript
// Open maximum 100 file descriptors at once
deferred.map(filenames, deferred.gate(function (filename) {
	return readFile(filename, 'utf-8');
}, 100))(function (result) {
	// result is an array of file's contents
});
```

## Progress and other events

__Promise objects are also an event emitters__. Deferred implementation is backed by cross-environment [event-emitter solution](https://github.com/medikoo/event-emitter)

Simple Ajax file uploader example:

```javascript
var ajaxFileUploader = function (url, data) {
  var def = deferred();
  var xhr = new XMLHttpRequest();

  xhr.open('POST', url, true);
  xhr.onload = def.resolve;
  xhr.onerror = function () {
    def.resolve(new Error("Could not upload files"));
  };
  xhr.upload.onprogress = function (e) {
    def.promise.emit('progress', e);
  };
  xhr.send(data);
  return def.promise;
};

var upload = ajaxFileUploader(formData);
upload.on('progress', function () {
  // process progress events
});
upload.done(function (e) {
  // All files uploaded!
});
```
### Streaming data partially

Another use case would be to provide obtained data partially on the go (stream like).
Imagine recursive directory reader that scans whole file system and provides filenames as it approaches them:

```javascript
var reader = readdirDeep(rootPath); // reader promise is returned
reader.on('data', function (someFilenames) {
	// Called many times during scan with obtained names
});
reader.done(function (allFilenames) {
	// File-system scan finished!
});
```

## Promise extensions

Promise objects are equipped with some useful extensions. All extension are optional but are loaded by default when `deferred` is loaded via `require('deferred')` import.
When preparing client-side file (with help of e.g. [modules-webmake](https://github.com/medikoo/modules-webmake)) you are free to decide, which extensions you want to take (see source of `lib/index.js` on how to do that)

### aside

Third brother of `then` and `done`. Has same signature but neither extends chain nor ends it, instead splits it by returning promise on which it was invoked. Useful when we want to return promise, but on a side (in parallel) do something else with obtained value:

```javascript
var x = deferred({ foo: 'bar' });
var promise = deferred({ foo: 'bar' });

var y = promise.aside(function (value) {
	console.log(value === x); // true
});
console.log(y === promise); // true
```

### catch

Same as `then` but accepts only `onFail` callback.

```javascript

var def = deferred(), promise2;

promise2 = def.promise.catch(function () {
  return 'Never mind';
});

def.reject(new Error("Error"));

promise2.done(function (value) {
  console.log(value); // Prints "Never mind"
});
```

### cb

Convert back to callback style. Useful if you want to process regular callback at the end of promise chain. Simple use case would be regular asynchronous function built internally with promises. `cb` also makes sure that your callback is not called immediately but in next tick earliest.

With cb we may build hybrid functions that do both, handle asynchronous callback and return promise:

```javascript
var asyncFunction = function (x, y, callback)  {
	deferred({ foo: x, bar: y }).cb(callback);
});
```

### finally

Invokes given callback when promise is either fulfilled or rejected

```javascript

var prepare = function () { ... }
  , cleanup = function () { ... }

prepare();
promise = asyncFn();
promise.finally(cleanup);
```

### get

To directly get to object property use `get`

```javascript
var promise = deferred({ foo: 'bar' });

promise(function (obj) {
	console.log(obj.foo); // 'bar';
})

promise.get('foo')(function (value) {
	console.log(value); // 'bar'
});
```

You can get to nested properties as well:

```javascript
var promise = deferred({ foo: { bar: 317 });

promise(function (obj) {
	console.log(obj.foo.bar); // 317;
})

promise.get('foo', 'bar')(function (value) {
	console.log(value); // 317
});
```

### invoke & invokeAsync

Schedule function call on returned object

```javascript
var promise = deferred({ foo: function (arg) { return arg*arg; } });

promise.invoke('foo', 3)(function (result) {
	console.log(result); // 9
});

// For asynchronous functions use invokeAsync
var promise = deferred({ foo: function (arg, callback) {
	setTimeout(function () {
		callback(null, arg*arg);
	}, 100);
} });

promise.invokeAsync('foo', 3)(function (result) {
	console.log(result); // 9
});
```

### map

See [promise aware version of Array's map](#map).

### match

If promise expected value is a list that you want to match into function arguments then use `match`

```javascript
var promise = deferred([2, 3]);

promise.match(function (a, b) {
	console.log(a + b); // 5
});
```

### reduce

See [promise aware version of Array's reduce](#reduce)

### some

See [promise aware version of Array's some](#some)

## Debugging

### Monitoring unresolved promises

In properly constructed flow, there should be no promises that are never resolved.
If you want to be sure that it's not the case, or you suspect there are such issues, check whether deferred's monitor has something to say

```javascript
deferred.monitor();
```

By default monitor will log error for every promise that was not resolved in 5 seconds.
You can customize that timeout, and handle errors with your own listener:

```javascript
deferred.monitor(10000, function (err) {
  // Called for each promise not resolved in 10 seconds time
});
```

This extension affects performance and it's best not to use it in production environment

### Usage statistics

Being able to see how many promises were initialized (and where) in our flow can be helpful to track application issues, it's also good way to confirm that constructed flow works as intended.

```javascript
deferred.profile(); // Start collecting statistics

//...

var stats = deferred.profileEnd(); // End profiling
console.log(stats.log); // See readable output
```

Example log output:

```
------------------------------------------------------------
Deferred/Promise usage statistics:

104540 Total promises initialized
104540 Initialized as Unresolved
     0 Initialized as Resolved

Unresolved promises were initialized at:
 22590 at Object.module.exports.factory (/Users/medikoo/Projects/_packages/next/lib/fs/_memoize-watcher.js:21:10)
 11553 at Object.IsIgnored.init (/Users/medikoo/Projects/_packages/next/lib/fs/is-ignored.js:140:18)
 11553 at module.exports.factory (/Users/medikoo/Projects/_packages/next/lib/fs/_memoize-watcher.js:21:10)
  7854 at Object.Readdir.filterIgnored (/Users/medikoo/Projects/_packages/next/lib/fs/readdir.js:434:23)
  4619 at Object.module.exports.factory (/Users/medikoo/Projects/_packages/next/lib/fs/_memoize-watcher.js:21:10)
  3927 at Object.Readdir.filterByType (/Users/medikoo/Projects/_packages/next/lib/fs/readdir.js:222:15)
  3927 at Object.Readdir.filterByType (/Users/medikoo/Projects/_packages/next/lib/fs/readdir.js:236:15)
  3927 at Object.self (/Users/medikoo/Projects/_packages/next/lib/fs/readdir.js:164:12)
  3927 at Object.Readdir.readdir (/Users/medikoo/Projects/_packages/next/lib/fs/readdir.js:540:9)
  3927 at Object.self (/Users/medikoo/Projects/_packages/next/lib/fs/readdir.js:164:21)
  3729 at directory (/Users/medikoo/Projects/_packages/next/lib/fs/_watch-alt.js:95:2)
  2820 at Readdir.filterIgnored.promise.root (/Users/medikoo/Projects/_packages/next/lib/fs/readdir.js:517:9)
  2163 at basic (/Users/medikoo/Projects/_packages/next/lib/fs/is-gitrepo-root.js:14:8)
  2159 at buildMap (/Users/medikoo/Projects/_packages/next/lib/fs/is-ignored.js:117:22)
  2159 at Object.FindRoot (/Users/medikoo/Projects/_packages/next/lib/fs/find-root.js:18:15)
  1107 at Readdir.filterIgnored.promise.root (/Users/medikoo/Projects/_packages/next/lib/fs/readdir.js:527:11)
   697 at Object.Map.addPaths (/Users/medikoo/Projects/_packages/next/lib/fs/_get-conf-file-map.js:107:19)
   697 at readFile (/Users/medikoo/Projects/_packages/next/lib/fs/read-file.js:18:8)
   697 at Object.readRulesWatch (/Users/medikoo/Projects/_packages/next/lib/fs/_get-conf-file-map.js:45:12)
   247 at module.exports (/Users/medikoo/Projects/_packages/next/lib/fs/_watch.js:90:2)
   247 at module.exports (/Users/medikoo/Projects/_packages/next/lib/fs/_watch.js:90:13)
     1 at Object.Readdir.init (/Users/medikoo/Projects/_packa
```

__Using profiler significantly affects performance don't  use it in production environment.__

## Performance

Promises just by being rich objects introduce overhead over regular callbacks. If we do a lot asynchronous operations that are fast, performance of promise implementation that we rely on becomes a significant factor.

_benchmark_ folder contains few plain test cases that compares Deferred to other popular promise implementations. Base of test is plain [lstat](http://nodejs.org/api/all.html#all_fs_lstat_path_callback) call to self file.

_Example output taken under Node v0.10.20 on 2008 MBP._

```
Promise overhead (calling one after another) x10000:

 1:   439ms  Base (plain Node.js lstat call)
 2:   461ms  Kew: Dedicated wrapper
 3:   609ms  Bluebird: Dedicated wrapper
 4:   614ms  Bluebird: Promisify (generic wrapper)
 5:   642ms  Deferred: Dedicated wrapper
 6:   720ms  Deferred: Promisify (generic wrapper)
 7:   792ms  When: Dedicated wrapper
 8:  1068ms  Q: Dedicated wrapper
 9:  1611ms  Q: nbind (generic wrapper)

Promise overhead (concurrent calls) x10000:

 1:   279ms  Base (plain Node.js lstat call)
 2:   293ms  Bluebird: Promisify (generic wrapper) 2
 3:   294ms  Bluebird: Dedicated wrapper
 4:   329ms  Kew: Dedicated wrapper
 5:   406ms  When: Dedicated wrapper
 6:   430ms  Deferred: Dedicated wrapper
 7:   598ms  Deferred: Promisify (generic wrapper)
 8:   683ms  Deferred: Map + Promisify
 9:  1610ms  Q: Dedicated wrapper
10:  3645ms  Q: nbind (generic wrapper)
```

## Tests [![Build Status](https://travis-ci.org/medikoo/deferred.png?branch=master)](https://travis-ci.org/medikoo/deferred)

__Covered by over 300 hundred unit tests__

	$ npm test
