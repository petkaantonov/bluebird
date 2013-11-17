# liar

  A modular collection of tools for asynchronous programing via promises, all tools are available as a bundle here or standalone in their own repo.

## API

```bash
npm install liar
```

```javascript
var promise = require('liar');
```

###[basic promise](https://github.com/calvinmetcalf/lie)

```javascript
promise(function(resolve,reject){
    resolve(value);
    //or
    reject(reason);
});
```

a shortcut to [my library lie](ttps://github.com/calvinmetcalf/lie). You need to give it a function
which takes 2 arguments, a function to call on success and one to call on failure.

###[all](https://github.com/calvinmetcalf/lie-all)

```javascript
promise.all(array (or promise for an array) of promises)
```

returns a promise for an array of all the responses, returns an error if any of the promises throw errors. Returned values are in the same order as the input array.

###[some](https://github.com/calvinmetcalf/lie-some)

```javascript
promise.some(array (or promise for an array) of promises)
```

Similar to all but will only throw an error if all of the promises throw errors, otherwise returns an array of whichever values succeeded in the order that they completed, on error returns an array of errors.

###[map](https://github.com/calvinmetcalf/lie-map)

```javascript
promise.map(array (or promise for an array) of promises, function)
```

Takes the array of values, applies function to them, and returns a promise for all the values. Function will be called with a value (not a promise) and may return either a promise or a value, array can filled with promises or values or a mixture.


###[race](https://github.com/calvinmetcalf/lie-race)

```javascript
promise.race(array (or promise for an array) of promises)
```

resolved with whatever value or error that resolves first.

###[cast](https://github.com/calvinmetcalf/lie-cast)

```javascript
promise.cast(value or promise)
```

If it's a promise, returns it, if it's a value, returns a promise that resolves to it.

###[use](https://github.com/calvinmetcalf/lie-use)

```javascript
promise.use(value or promise, function)
```

If the value is a promise, apply the function to the value it resolves into and return a promise for that, otherwise apply the function to the value and return the result.

###[resolve](https://github.com/calvinmetcalf/lie-resolve)

```javascript
promise.resolve(value)
```

create a promise that is resolved with this value.

###[reject](https://github.com/calvinmetcalf/lie-reject)

```javascript
promise.reject(value)
```

create a promise that is rejected with this value.

###[denodify](https://github.com/calvinmetcalf/lie-denodify)

```javascript
promise.denodify(function)
```

takes as an argument a function which has a callback as it's last argument, returns a function that acts identically except it returns a promise instead of taking a callback.

###[fold left](https://github.com/calvinmetcalf/lie-lfold)

```javascript
promise.lfold(array (or promise for an array) of things,function,accumulator)
```

like Array.prototype.reduce, but the array may include promises or values and the function may return a promise or a value. `promise.lfold` always return a promise.

###[fold right](https://github.com/calvinmetcalf/lie-rfold)

```javascript
promise.rfold(array (or promise for an array) of things,function,accumulator)
```

like Array.prototype.reduceRight, but the array may include promises or values and the function may return a promise or a value. `promise.rfold` always return a promise.

in other words it's like [fold left](https://github.com/calvinmetcalf/lie-lfold) but starts at the right

###[fold](https://github.com/calvinmetcalf/lie-fold)

```javascript
promise.fold(array (or promise for an array) of things,function,accumulator)
```

like Array.prototype.reduce, but the array may include promises or values and the function may return a promise or a value. `promise.fold` always return a promise.

unlike [lfold](https://github.com/calvinmetcalf/lie-lfold) and [rfold](https://github.com/calvinmetcalf/lie-rfold) fold calls the values in the order the promises resolve.

###[apply](https://github.com/calvinmetcalf/lie-apply)

```javascript
promise.apply(function, one or more values or promises)
```

calls the function with the values or promises once they all resolve, returns the result.

###[zip](https://github.com/calvinmetcalf/lie-zip)

```javascript
promise.zip(one or more arrays of things (or promises for arrays))
```

promise.zips the 2 or more arrays up such that `zip([1,2],['a','b'])` returns `[[1,'a'],[2,'b']];`. When called with one array it is equivalent to [lie-map](https://github.com/calvinmetcalf/lie-map) called with the `function(a){return [a]}`.

###[zipwith](https://github.com/calvinmetcalf/lie-zipwith)

```javascript
promise.zipwith(function,one or more arrays of things (or promises for arrays)
```

zips the 2 or more arrays up with a function 'func' such that `zip(func(1,2),func('a','b'))` returns `[func(1,'a'),func(2,'b')];`. When called with one array it is equivalent to [lie-map](https://github.com/calvinmetcalf/lie-map) (with the arguments in reverse order).

###[filter](https://github.com/calvinmetcalf/lie-filter)

```javascript
promise.filter(array (or promise for an array), function)
```

returns an array filtered based on the function, aka only truthy values are returned.

###[every](https://github.com/calvinmetcalf/lie-every)

```javascript
promise.every(array (or promise for an array)[, function])
```

Applies the function the the array of promies or values (or mix) and returns true if they are all truthy.

It is lazy and will resolve as soon as the first falsy value is encountered.

If the function is omited then it tests the truthiness of the values.

###[any](https://github.com/calvinmetcalf/lie-any)

```javascript
promise.any(array (or promise for an array)[, function])
```

Applies the function the the array of promies or values (or mix) and returns true if at least one value is truthy.

It is lazy and will resolve as soon as one value returns true, if the function is omited then it tests the truthiness of the array.

## License

  MIT
