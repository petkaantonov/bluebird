```javascript
var rfold = require('lie-rfold');
```

###fold right

```javascript
rfold(array (or promise for array) of things,function,accumulator)
```

like Array.prototype.reduceRight, but the array may include promises or values and the function may return a promise or a value. `rfold` always return a promise.


## License

  MIT
