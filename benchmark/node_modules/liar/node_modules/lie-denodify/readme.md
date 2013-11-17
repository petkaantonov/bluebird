# lie-denodify


## API

```bash
npm install lie-denodify
```

```javascript
var denodify = require('lie-denodify');
```

###denodify

```javascript
denodify(function)
```

takes as an argument a function which has a callback as it's last argument, returns a function that acts identically except it returns a promise instead of taking a callback.

## License

  MIT
