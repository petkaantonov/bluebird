var browserGlobal = (typeof window !== 'undefined') ? window : {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var async;
var local = (typeof global !== 'undefined') ? global : this;

// old node
function useNextTick() {
  return function(callback, arg) {
    process.nextTick(function() {
      callback(arg);
    });
  };
}

// node >= 0.10.x
function useSetImmediate() {
  return function(callback, arg) {
    /* global  setImmediate */
    setImmediate(function(){
      callback(arg);
    });
  };
}

function useMutationObserver() {
  var queue = [];

  var observer = new BrowserMutationObserver(function() {
    var toProcess = queue.slice();
    queue = [];

    toProcess.forEach(function(tuple) {
      var callback = tuple[0], arg= tuple[1];
      callback(arg);
    });
  });

  var element = document.createElement('div');
  observer.observe(element, { attributes: true });

  // Chrome Memory Leak: https://bugs.webkit.org/show_bug.cgi?id=93661
  window.addEventListener('unload', function(){
    observer.disconnect();
    observer = null;
  }, false);

  return function(callback, arg) {
    queue.push([callback, arg]);
    element.setAttribute('drainQueue', 'drainQueue');
  };
}

function useSetTimeout() {
  return function(callback, arg) {
    local.setTimeout(function() {
      callback(arg);
    }, 1);
  };
}

if (typeof setImmediate === 'function') {
  async = useSetImmediate();
} else if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
  async = useNextTick();
} else if (BrowserMutationObserver) {
  async = useMutationObserver();
} else {
  async = useSetTimeout();
}

export { async };
