```javascript
var zipwith = require('lie-zipwith');
```

###zipwith

```javascript
zipwith(function,array of things[,...] (or promises for arrays of things))
```

zips the 2 or more arrays up with a function 'func' such that `zip(func(1,2),func('a','b'))` returns `[func(1,'a'),func(2,'b')];`. When called with one array it is equivalent to [lie-map](https://github.com/calvinmetcalf/lie-map) (with the arguments in reverse order).

## License

  MIT
