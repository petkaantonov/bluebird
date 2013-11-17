# EventEmitter – Cross-environment event emitter solution for JavaScript

## Usage

```javascript
var ee = require('event-emitter');

var emitter = ee({}), listener;

emitter.on('test', listener = function (args) {
  // …emitter logic
});

emitter.once('test', function (args) {
  // …invoked only once(!)
});

emitter.emit('test', arg1, arg2/*…args*/); // Two above listeners invoked
emitter.emit('test', arg1, arg2/*…args*/); // Only first listener invoked

emitter.off('test', listener);              // Removed first listener
emitter.emit('test', arg1, arg2/*…args*/); // No listeners invoked
```

## Installation
### NPM

In your project path:

	$ npm install event-emitter

### Browser

Browser bundle can be easily created with help of [modules-webmake](https://github.com/medikoo/modules-webmake). Assuming that you have latest [Node.js](http://nodejs.org/) and [Git](http://git-scm.com/) installed, following will work in command shell of any system (Linux/MacOS/Windows):

```
$ npm install -g webmake
$ git clone git://github.com/medikoo/event-emitter.git
$ cd event-emitter
$ npm install
$ cd ..
$ webmake --name=eventEmitter event-emitter/lib/index.js event-emitter.js
```

If you work with AMD modules, add _amd_ option, so generated bundle is one:

```
$ webmake --name=eventEmitter --amd event-emitter/lib/index.js event-emitter.js
```

_Mind that eventEmitter relies on some EcmaScript5 features, so for older browsers you need to load as well [es5-shim](https://github.com/kriskowal/es5-shim)_

## Functionalities provided as separate modules

### allOff(obj)

Remove all listeners

```javascript
var eeAllOff = require('event-emitter/lib/all-off');
eeAllOff(emitter); // Removed all registered listeners on emitter
```

### unify(emitter1, emitter2)

Unify listeners database of two emitter.
Events emitted on either emitter will call listeners attached to emitter object

```javascript
var eeUnify = require('event-emitter/lib/unify');

var emitter1 = ee(), listener1, listener3;
var emitter2 = ee(), listener2, listener4;

emitter1.on('test', listener1 = function () { });
emitter2.on('test', listener2 = function () { });

emitter1.emit('test'); // Invoked listener1
emitter2.emit('test'); // Invoked listener2

var unify = eeUnify(emitter1, emitter2);

emitter1.emit('test'); // Invoked listener1 and listener2
emitter2.emit('test'); // Invoked listener1 and listener2

emitter1.on('test', listener3 = function () { });
emitter2.on('test', listener4 = function () { });

emitter1.emit('test'); // Invoked listener1, listener2, listener3 and listener4
emitter2.emit('test'); // Invoked listener1, listener2, listener3 and listener4
```

### hasListeners(obj[, type])

Whether given object have registered listeners

```javascript
var emitter = ee();
var hasListeners = require('event-emitter/lib/has-listeners');
var listener = function () {};

hasListeners(emitter); // false

emitter.on('foo', listener);
hasListeners(emitter); // true
hasListeners(emitter, 'foo'); // true
hasListeners(emitter, 'bar'); // false

emitter.off('foo', listener);
hasListeners(emitter, 'foo'); // false
```

## Tests [![Build Status](https://secure.travis-ci.org/medikoo/event-emitter.png?branch=master)](https://secure.travis-ci.org/medikoo/event-emitter)

	$ npm test
