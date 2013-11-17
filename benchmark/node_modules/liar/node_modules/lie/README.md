# lie
<a href="http://promises-aplus.github.com/promises-spec">
  <img src="http://promises-aplus.github.com/promises-spec/assets/logo-small.png"
       alt="Promises/A+ logo" title="Promises/A+ 1.0 compliant" align="right" />
</a>

lie is a JavaScript promise/deferred implementation, implementing the [Promises/A+ spec](http://promises-aplus.github.com/promises-spec/), with the goal of implementing the spec as closely as possible and nothing else,
this means created promises only have a then method and promises may only be created by passing a resolver function to the constructor.  Lie is not meant to compete with Q, When, or any of the other promise libraries
that already exist, it is meant to be a library you could use to create a [Q](https://github.com/kriskowal/q) or [When](https://github.com/cujojs/when) style tool belt, which I did [over here](https://github.com/calvinmetcalf/liar).

A fork of [Ruben Verborgh's](https://github.com/RubenVerborgh) library called [promiscuous](https://github.com/RubenVerborgh/promiscuous).
Which takes advantage of my [immediate library](https://github.com/calvinmetcalf/setImmediate), uses object constructors, and with a name I can actually consistently spell. 
Plus if I learned anything from [catiline](https://github.com/calvinmetcalf/catiline) (formally communist) it's that you don't want to pick an even mildly offensive name.

## API

by defailt adds a function called 'promise' to the global scope (or if you grab the noConflict version than one called lie)

### return a promise
```javascript
function waitAwhile(){
	return promise(function(resolve,reject){
	    doSomething(functin(err,result){
	        if(err){
	            reject(err);
	        }else{
	            resolve(result);
	        }
	    });
	});
}
```

### Write a function turns node style callback to promises
```javascript
function denodify(func){
    return function() {
        var args = Array.prototype.concat.apply([], arguments);
        return promise(function(resolve, reject) {
            args.push(function(err, success) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(success);
                }
            });
            func.apply(undefined, args);
        });
    };
};
```

##node

install with `npm install lie`, exactly the same as above but 

```javascript
var promise = require('lie');
```

