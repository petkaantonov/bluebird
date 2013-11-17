```javascript
var lfold = require('lie-lfold');
```

###fold left

```javascript
lfold(array(or promise for array) of things,function,accumulator)
```

like Array.prototype.reduce, but the array may include promises or values and the function may return a promise or a value. `lfold` always return a promise.


## License

  MIT
