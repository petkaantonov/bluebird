# lie-any


## API

```bash
npm install lie-any
```

```javascript
var any = require('lie-any');
```

###any

```javascript
any(array[, function])
```

Applies the function the the array of promies or values (or mix) and returns true if at least one value is truthy.

It is lazy and will resolve as soon as one value returns true, if the function is omited then it tests the truthiness of the array.


## License

  MIT
