# lie-race


## API

```bash
npm install lie-race
```

```javascript
var race = require('lie-race');
```

###race

```javascript
race(array (or promise for an array) of promises)
```

resolved with whatever value or error that resolves first.

should be obvious but fyi, this can cause race conditions.

## License

  MIT
