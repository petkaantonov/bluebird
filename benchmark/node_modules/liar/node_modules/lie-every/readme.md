
# lie-every


## API

```bash
npm install lie-every
```

```javascript
var every = require('lie-every');
```

###every

```javascript
every(array[, function])
```

Applies the function the the array of promies or values (or mix) and returns true if they are all truthy.

It is lazy and will resolve as soon as the first falsy value is encountered.

If the function is omited then it tests the truthiness of the values.

## License

  MIT
