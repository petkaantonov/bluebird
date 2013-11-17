# lie-some


## API

```bash
npm install lie-some
```

```javascript
var some = require('lie-some');
```

###some

```javascript
some(array of promises(or promise for such))
```

Similar to [lie-all](https://github.com/calvinmetcalf/lie-all) but will only throw an error if all of the promises throw errors, otherwise returns an array of whichever values succeded in the order that they completed, on error returns an array of errors.

## License

  MIT
