---
id: async-dialogs
title: Async Dialogs
---

[async-dialogs](unfinished-article)

Typically *promises* are used in conjunction with asynchronous tasks such as a
network request or a `setTimeout`; a lesser explored use is dealing with user
input. Since a program has to wait for a user to continue some actions it makes
sense to consider it an asynchronous event.

For comparison I'll start with an example of a *synchronous* user interaction
using `window.prompt` and then move to an *asynchronous* interaction by making
our own DOM based prompt. To begin, here is a template for a simple HTML page:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Async Dislogs Example</title>
  <script src="//cdn.jsdelivr.net/bluebird/{{ site.version }}/bluebird.js"></script>
  <script type="text/javascript">
    document.addEventListener('DOMContentLoaded', function() {
      var time = document.getElementById('time-stamp');
      clockTick();
      setInterval(clockTick, 1000);
      function clockTick() {
        time.innerHTML = new Date().toLocaleTimeString();
      }
    });
  </script>
</head>
<body>
  <p>The current time is <span id="time-stamp"></span>.</p>
  <p>Your name is <span id="prompt"></span>.</p>
  <button id="action">Set Name</button>
</body>
</html>
```

`window.prompt` blocks the web page from processing while it waits for the user
to enter in data. It has to block because the input is returned and the next
line of code needs that result. But for sake of this tutorial we are going to
convert the typical conditional code into a promise API using a [promise
constructor](api/new-promise.html).

```javascript
function promptPromise(message) {
  return new Promise(function(resolve, reject) {
    var result = window.prompt(message);
    if (result != null) {
      resolve(result);
    } else {
      reject(new Error('User cancelled'));
    }
  });
}

var button = document.getElementById('action');
var output = document.getElementById('prompt');

button.addEventListener('click', function() {
  promptPromise('What is your name?')
    .then(function(name) {
      output.innerHTML = String(name);
    })
    .catch(function() {
      output.innerHTML = '¯\\_(ツ)_/¯';
    });
});
```

[Run example on JSBin][Example1]

This doesn't add much much using `window.prompt`; however, one advantage is the
API that promises provide. In the case where we call `promptPromise(…)` we can
easily react to the result of the dialog without having to worry about how it is
implemented. In our example we've implemented the `window.prompt` but our call
to `promptPromise()` doesn't care. This makes a change to an *asynchronous*
dialog a little more future proof.

To drive home the synchronous nature of the `window.prompt` notice that the time
stops ticking when the prompt dialog is displayed. Let's fix that by making our
own prompt. Since our dialog is just DOM manipulation the page won't be blocked
while waiting for user input.

First add the prompt dialog to the HTML:

```html
<style type="text/css">
  #dialog {
    width:      200px;
    margin:     auto;
    padding:    10px;
    border:     thin solid black;
    background: lightgreen;
  }
  .hidden {
    display: none;
  }
</style>
<div id="dialog" class="hidden">
  <div class="message">foobar</div>
  <input type="text">
  <div>
    <button class="ok">Ok</button>
    <button class="cancel">Cancel</button>
  </div>
</div>
```

We will want to keep the same API so our change will be only to the
`promisePrompt`. It will find the dialog DOM elements, attach events to the
elements, show the dialog box, return a promise that is resolved based on the
attached events, and finally detaches the events and cleans up after itself
(hiding the dialog box for another use later).

```javascript
function promptPromise(message) {
  var dialog       = document.getElementById('dialog');
  var input        = dialog.querySelector('input');
  var okButton     = dialog.querySelector('button.ok');
  var cancelButton = dialog.querySelector('button.cancel');

  dialog.querySelector('.message').innerHTML = String(message);
  dialog.className = '';

  return new Promise(function(resolve, reject) {
    dialog.addEventListener('click', function handleButtonClicks(e) {
      if (e.target.tagName !== 'BUTTON') { return; }
      dialog.removeEventListener('click', handleButtonClicks);
      dialog.className = 'hidden';
      if (e.target === okButton) {
        resolve(input.value);
      } else {
        reject(new Error('User cancelled'));
      }
    });
  });
}
```

[Run example on JSBin][Example2]

Now when the user presses the **Set Name** button the clock continues to update
while the dialog is visible.

Because the `removeEventListener` requires a reference to the original function
that was used with the `addEventListener` it makes it difficult to clean up
after itself without storing the references in a scope higher then the handler
itself. Using a named function we can reference it when a user clicks the
button. To help with performance and to avoid duplicating code the example uses
[event delegation][1] to capture both buttons in one *click* handler.

[1]: https://davidwalsh.name/event-delegate

The same thing can be done with less code using jQuery's [event
namespacing](https://api.jquery.com/on/#event-names).

```javascript
return new Promise(function(resolve, reject) {
  $('#okButton').on('click.promptDialog', function() {
    resolve(input.value);
  });
  $('#cancelButton').on('click.promptDialog', reject);
})
.finally(function() {
  $('#okButton').off('click.promptDialog');
  $('#cancelButton').off('click.promptDialog');
});
```

There are still a few problems with the earlier code example. It feels like it
is doing too much. A *squint* test reveals behavior for showing the dialog, set
the dialog's message, attach two DOM events, construct a promise, event
delegation, hide the dialog, and finally detach DOM events. That is a lot for
one little function. A refactoring can help.

Abstraction is the key here. We will make an *object* (or class) that is
responsible for managing the dialog box. Its interface will manage only two
function references (callbacks): when the user clicks ok and when user clicks
cancel. And it will offer the value when asked.

Using an abstraction like this the `promisePrompt` no longer needs to know
anything about the DOM and concentrates on just providing a promise. This will
also make things easier to create a promised version of a progress bar or
confirmation dialog or any other type of UI that we want to have a value for.
All we will need to do is write a class for that dialog type with the same
interface and just pass that class into our promise making method.

The dialog interface might look like this:

```javascript
var noop = function() {
  return this;
};

function Dialog() {
  this.setCallbacks(noop, noop);
}
Dialog.prototype.setCallbacks = function(okCallback, cancelCallback) {
  this._okCallback     = okCallback;
  this._cancelCallback = cancelCallback;
  return this;
};
Dialog.prototype.waitForUser = function() {
  var _this = this;
  return new Promise(function(resolve, reject) {
    _this.setCallbacks(resolve, reject);
  });
};
Dialog.prototype.show = noop;
Dialog.prototype.hide = noop;
```

Initially the Dialog class sets the two callbacks to *noop* functions. It is up
to the child class to call them when necessary. We break down the promise
creation to one function `waitForUser()` that sets the callbacks and returns a
promise. At this level the `show()` and `hide()` are just *noop* functions as
well and will be implemented by the child classes.

Our `PromptDialog` class is responsible for inheriting from `Dialog` and setting
up the required DOM scaffolding and eventually call `this._okCallback` or
`this._cancelCallback` as appropriate.

It might look like this:

```javascript
function PromptDialog() {
  Dialog.call(this);
  this.el           = document.getElementById('dialog');
  this.inputEl      = this.el.querySelector('input');
  this.messageEl    = this.el.querySelector('.message');
  this.okButton     = this.el.querySelector('button.ok');
  this.cancelButton = this.el.querySelector('button.cancel');
  this.attachDomEvents();
}
PromptDialog.prototype = Object.create(Dialog.prototype);
PromptDialog.prototype.attachDomEvents = function() {
  var _this = this;
  this.okButton.addEventListener('click', function() {
    _this._okCallback(_this.inputEl.value);
  });
  this.cancelButton.addEventListener('click', function() {
    _this._cancelCallback();
  });
};
PromptDialog.prototype.show = function(message) {
  this.messageEl.innerHTML = String(message);
  this.el.className = '';
  return this;
};
PromptDialog.prototype.hide = function() {
  this.el.className = 'hidden';
  return this;
};
```

Notice that use of `return this;` in most of the functions? That pattern will
allow method chaining as you'll see shortly.

This inherits from `Dialog` and stores references to the required DOM elements
that this dialog uses. It then attaches the require DOM events
(`attachDomEvents()`) which eventually call the callbacks. Then it implements
the `show()` and `hide()` methods. Its usage is more flexible and verbose:

```javascript
var output = document.getElementById('prompt');
var prompt = new PromptDialog();

prompt.show('What is your name?')
  .waitForUser()
  .then(function(name) {
    output.innerHTML = String(name);
  })
  .catch(function() {
    output.innerHTML = '¯\\_(ツ)_/¯';
  })
  .finally(function() {
    prompt.hide();
  });
```

[Run example on JSBin][Example3]

This abstraction can be expanded on in other ways. For example a notification
dialog:

```javascript
function NotifyDialog() {
  Dialog.call(this);
  var _this      = this;
  this.el        = document.getElementById('notify-dialog');
  this.messageEl = this.el.querySelector('.message');
  this.okButton  = this.el.querySelector('button.ok');
  this.okButton.addEventListener('click', function() {
    _this._okCallback();
  });
}
NotifyDialog.prototype = Object.create(Dialog.prototype);
NotifyDialog.prototype.show = function(message) {
  this.messageEl.innerHTML = String(message);
  this.el.className = '';
  return this;
};
NotifyDialog.prototype.show = function() {
  this.el.className = 'hidden';
  return this;
};
```

#### Exercises for the student

1.  Write a function that takes a `Dialog` instance and a default value. Have it
    return a promise that resolves to the default value if the user clicks
    cancel.
2.  With the use of abstract classes can the similarities between `PromptDialog`
    and `NotifyDialog` be abstracted? Make a sub class of `Dialog` that
    abstracts the common DOM code (`DOMDialog`). Then refactor the
    `PromptDialog` and `NotifyDialog` to inherate from `DOMDialog` but
    references the correct DOM selectors.

## Cancellation

Something missing from the above example is proper error handling. When it comes
to promises it is a best practise to always *reject a promise with an Error* and
not with plain data such as an object, string, number, or null/undefined. The
reasoning for this is promises are best used as a way to regain some of the
syntax you have with the standard `try {} catch() {}` blocks with asynchronous
code.

An advantage of using `Error`s is the ability to test why a promise was rejected
and make decisions on that. This ability is also baked into how Bluebird works.
You can pass in a predicate to the `catch()` block allowing you to have more
than one block based on what `Error` it was rejected with. For example:

```javascript
doSomething().then(function(value) {
  // Do something with value or fail with an error.
  throw new Error('testing errors');
})
.catch(ArgumentError, function(e) {
  console.log('You buggered up something with the arguments.', e);
})
.catch(SyntaxError, function(e) {
  console.log('Check your syntax!', e);
})
.catch(function(e) {
  // e is an Error object.
  console.log('Well something genaric happened.', e);
});
```

In our dialog example perhaps we want to differentiate between a rejected
promise because of some problem (bad AJAX, programming error, etc.) or because
the user pressed the cancel button.

To do this we will have two `catch()` functions one for `UserCanceledError` and
one for any other `Error`. We can make a custom error like so:

```javascript
function UserCanceledError() {
  this.name = 'UserCanceledError';
  this.message = 'Dialog cancelled';
}
UserCanceledError.prototype = Object.create(Error.prototype);
```

See [this StackOverflow answer](http://stackoverflow.com/a/17891099/227176) for
a more detailed and feature complete way to make custom errors.

Now we can add a `cancel()` reject with this in our event listener:

```javascript
Dialog.prototype.cancel = function() {
  this._cancelCallback(new UserCanceledError());
};

…

PromptDialog.prototype.attachDomEvents = function() {
  var _this = this;
  this.okButton.addEventListener('click', function() {
    _this._okCallback(_this.inputEl.value);
  });
  this.cancelButton.addEventListener('click', function() {
    _this.cancel();
  });
};
```

And in our usage case we can test for it:

```javascript
// Timeout the dialog in five seconds.
setTimeout(function() { prompt.cancel(); }, 5000);

prompt.show('What is your name?')
  .waitForUser()
  .then(function(name) {
    output.innerHTML = String(name);
  })
  .catch(UserCanceledError, function() {
    output.innerHTML = '¯\\_(ツ)_/¯';
  })
  .catch(function(e) {
    console.log('Something bad happened!', e);
  })
  .finally(function() {
    prompt.hide();
  });
```

[Run example on JSBin][Example4]

**NOTE:** Bluebird supports [cancellation](api/cancellation.html) as an optional
feature that is turned off by default. However, its implementation (since
version 3.0) is meant to stop the then and catch callbacks from firing. It is
not helpful in the example of a user cancellation as described here.

## Progress bar

When there are asynchronous tasks that have the ability to notify progress as
they complete it can be tempting to want that in the promise that represents
that task. Unfortunately this is a bit of an anti-pattern. That is because the
point of promises is to represent a value as if it was natural (like it is in
normal synchronous code) and not to be over glorified callback management.

So how then could we represent a progress bar like dialog? Well the answer is to
manage the progress through callbacks outside the promise API. Bluebird has
since [deprecated the progression feature](deprecated-apis.html#progression) and
offers an alternative which I hope to illustrate here.

Another key difference between a *progress bar* dialog and any other dialog
we've discussed here is that a progress bar represents information on another
task and *not* user import. Instead of the program waiting for the user to
provide a value the dialog box is waiting on the program to provide a value
(resolved: 100% complete, rejected: aborted half way through). Because of this
the *progress bar* dialog would have a different interface then the previous
dialogs we've covered. However, there can still be some user interaction so in
essence we are dealing with two promises.

Bluebird has a way to manage more than one promise simultaneously. When you want
to know if more then one promise completes there is a `Promise.all()` function
that takes an array of promises and returns a new promise waiting for them all
to resolve. But if any one is rejected the returned promise is immediately
rejected.

Bluebird also has a `Promise.race()` function which does the same thing but
doesn't wait for all of them to finish. That is what we want. An example how
this might look:

```javascript
function showProgress(otherPromise) {
  var progress = new ProgressbarDialog().show('Uploading…');
  return Promise.race([otherPromise, promise.waitForUser()])
    .finally(function() {
      progress.hide();
    });
}
```

Here is some example HTML for the Progress Dialog:

```html
<style type="text/css">
  #progress-dialog {
    width:      200px;
    margin:     auto;
    border:     thin solid black;
    padding:    10px;
    background: lightgreen;
  }
  #progress-dialog .progress-bar {
    border:  1px solid black;
    margin:  10px auto;
    padding: 0;
    height:  20px;
  }
  #progress-dialog .progress-bar>div {
    background-color: blue;
    margin:           0;
    padding:          0;
    border:           none;
    height:           20px;
  }
</style>
<div id="progress-dialog">
  <div class="message"></div>
  <div class="progress-bar"><div></div></div>
  <div>
    <button class="cancel">Cancel</button>
  </div>
</div>
```

The JavaScript is the same as the `PromptDialog` only we will add a
`setProgress()` method:

```javascript
function ProgressDialog() {
  Dialog.call(this);
  this.el           = document.getElementById('progress-dialog');
  this.messageEl    = this.el.querySelector('.message');
  this.progressBar  = this.el.querySelector('.progress-bar>div');
  this.cancelButton = this.el.querySelector('button.cancel');
  this.attachDomEvents();
}
ProgressDialog.prototype = Object.create(Dialog.prototype);
ProgressDialog.prototype.attachDomEvents = function() {
  var _this = this;
  this.cancelButton.addEventListener('click', function() {
    _this.cancel();
  });

};
ProgressDialog.prototype.show = function(message) {
  this.messageEl.innerHTML = String(message);
  this.el.className = '';
  return this;
};
ProgressDialog.prototype.hide = function() {
  this.el.className = 'hidden';
  return this;
};
ProgressDialog.prototype.setProgress = function(percent) {
  this.progressBar.style.width = percent + '%';
};
```

A common misconception is that promises are a form of callback management. This
is not the case and is why the idea of having a progress callback is not part of
the Promise spec. However, much like the Promise library passes in a `resolve`
and `reject` callback when you create a new promise (`new Promise(…)`) we can do
the same patter for a progress callback.

Now to the fun part. For this tutorial we will *fake* a lengthy file upload by
using `setTimeout`. The intent is to provide a promise and to allow a progress
to be periodically ticked away. We will expect a function to be passed which
is called whenever the progress needs updating. And it returns a promise.

```javascript
function delayedPromise(progressCallback) {
  var step = 10;
  return new Promise(function(resolve, reject) {
    var progress = 0 - step; // So first run of nextTick will set progress to 0
    function nextTick() {
      if (progress >= 100 ) {
        resolve('done');
      } else {
        progress += step;
        progressCallback(progress);
        setTimeout(nextTick, 500);
      }
    }
    nextTick();
  });
}
```

When we construct our `ProgressDialog` we use the `waitForUser()` method to
capture the user interaction promise and then use `delayedPromise()` to capture
the fake network promise and finally `Promise.reace()` to manage the two
simultaneously and end with a single promise as usual.

```javascript
document.addEventListener('DOMContentLoaded', function() {
  var button = document.getElementById('action');
  var output = document.getElementById('output');

  var prompt = new ProgressDialog();

  button.addEventListener('click', function() {
    var pendingProgress = true;
    var waitForPromise = delayedPromise(function(progress) {
      if (pendingProgress) {
        prompt.setProgress(progress);
      }
    });

    // Prevent user from pressing button while dialog is visible.
    button.disabled = true;

    prompt.show('Simulating a file upload.');

    Promise.race([waitForPromise, prompt.waitForUser()])
      .then(function() {
        output.innerHTML = 'Progress completed';
      })
      .catch(UserCanceledError, function() {
        output.innerHTML = 'Progress canceled by user';
      })
      .catch(function(e) {
        console.log('Error', e);
      })
      .finally(function() {
        pendingProgress = false;
        button.disabled = false;
        prompt.hide();
      });
  });
});
```

[Run example on JSBin][Example5]

I hope this helps illustrate some concepts available with Promises and a
different perspective on how promises can represent more then just AJAX data.

Although the code may look verbose it does provide the benefit that it is
modular and can be easily changed. A trait difficult to achieve with a more
procedural style.

Happy coding, [@sukima](https://github.com/sukima).

[Example1]: http://jsbin.com/kowama/edit?js,output
[Example2]: http://jsbin.com/fucofu/edit?js,output
[Example3]: http://jsbin.com/wupixi/edit?js,output
[Example4]: http://jsbin.com/yaropo/edit?js,output
[Example5]: http://jsbin.com/bipeve/edit?js,output
