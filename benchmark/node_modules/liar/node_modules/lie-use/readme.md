# lie-use


## API

```bash
npm install lie-use
```

```javascript
var use = require('lie-use');
```

###use

```javascript
use(value or promise, function)
```

If the value is a promise, apply the function to the value it resolves into and return a promise for that, otherwise apply the function to the value and return the result.


## License

  MIT
