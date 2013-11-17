# lie-map


## API

```bash
npm install lie-map
```

```javascript
var map = require('lie-map');
```

###map

```javascript
map(array of promises, function)
```

Takes the array of values, applies function to them, and returns a promise for all the values. Function will be called with a value (not a promise) and may return either a promise or a value, array can filled with promises or values or a mixture.


## License

  MIT
