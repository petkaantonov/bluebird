Slider plugin for jQuery


Minimal configuration jQuery plugin with bootstrap style data api.

3kb gzipped and minified.

[demo.html](http://petkaantonov.github.io/jQuery-slider/demo.html)

Integrating with bootstrap
--------------------------

Add `@import "slider.less";` to your `bootstrap.less` file. 

Compile as normal.

Usage
-----

The slider can only be called on input elements, this helps keeping
the api size to minimum. 

    $('input').slider(options)
    
Options
-------

* min - the minimum value, default 1
* max - the maximum value, default 100
* step - the step size, default 1. Must be > 0
* focusable - is slider focusable? default is true
* rtl - specify right-to-left direction on the slider. The default is left-to-right. Only has an effect on horizontally oriented sliders. Automatically picked up from the active CSS writing direction on the element.

Methods
-------

__.slider("destroy")__
Destroy the slider enhancement from an input element

    $("#price").slider("destroy");
    
You can also just trigger the event `"destroy"` on the target element

    $("#price").trigger("destroy")
    
This way you don't have to remember which plugins to destroy when you remove the element. You need
to destroy the plugin when you remove the original input element, otherwise memory will be leaked.
    
*Deprecated*  <del>__.slider("disabled", true|false)__
Sets the disabled state of the slider as well as the input element</del>

This method has been deprecated, simply use `.prop` on the original `input` element

    $("#price").prop("disabled", true);
    
Events
------

* slidestart - fired before dragging the slider has started. Call `preventDefault()` on the event object to prevent sliding
* slide - fired constantly as the slider is being dragged
* slideend - fired before dragging the slider ends

Markup/Data-API
--------

You can use the slider plugin without extra javascript by specifying data attributes on the input element:

    <div id="target"></div>
    <input data-slider="#target" data-min="1" data-max="100" data-step="1">
    
The element only needs a `data-slider` attribute for it to be picked up. The value is used as a jQuery selector to find the element where the slider will be rendered.

**Note**: dynamically created elements need to be called manually with js. You may also call `$.fn.slider.refresh()` at any point to instantiate any
uninitialized `data-slider` inputs. It is automatically called once on DOM ready event which makes the data API work.

The disabled attribute of an input is automatically used to disable a slider. A slider will automatically
be vertically oriented if its dimensions suggest so (height > width).



See [demo.html](http://petkaantonov.github.io/jQuery-slider/demo.html) for better overview and tips for more advanced use.

Building
----------

Building requires [Closure Compiler](http://dl.google.com/closure-compiler/compiler-latest.zip) to be placed
one directory up from the project in `closure_compiler` directory.

The setting is in `Gruntfile.js`, expressed as `closurePath: '../closure_compiler'`

Clone or download the repository, and while in the project root, run:

    npm install
    grunt
    
Builds will appear in the `/js` folder. The source code cannot be ran directly without building.