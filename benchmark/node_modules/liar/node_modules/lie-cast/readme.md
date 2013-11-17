
# liar

  a toolbelt of deceit

## API

```bash
npm install liar
```

```javascript
var promise = require('liar');
```

###all

```javascript
promise.all(array of promises)
```

returns a promise for an array of all the responses, returns an error if any of the promises throw errors. Returned values are in the same order as the input array.

###some

```javascript
promise.some(array of promises)
```

Similar to all but will only throw an error if all of the promises throw errors, otherwise returns an array of whichever values succeded in the order that they completed, on error returns an array of errors.

###map

```javascript
promise.map(array of promises, function)
```

Takes the array of values, applies function to them, and returns a promise for all the values. Function will be called with a value (not a promise) and may return either a promise or a value, array can filled with promises or values or a mixture.


###race

```javascript
promise.race(array of promises)
```

resolved with whatever value or error that resolves first.

###cast

```javascript
promise.cast(value or promise)
```

If it's a promise, returns it, if it's a value, returns a promise that resolves to it.

###use

```javascript
promise.use(value or promise, function)
```

If the value is a promise, apply the function to the value it resolves into and return a promise for that, otherwise apply the function to the value and return the result.

###resolve

```javascript
promise.resolve(value)
```

create a promise that is resolved with this value.

###reject

```javascript
promise.reject(value)
```

create a promise that is rejected with this value.

## License

  MIT
