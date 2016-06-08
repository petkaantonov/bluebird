---
layout: api
id: promise.mapseries
title: Promise.mapSeries
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Promise.mapSeries

```js
Promise.mapSeries(
    Iterable<any>|Promise<Iterable<any>> input,
    function(any item, int index, int length) mapper
) -> Promise
```

Given an [`Iterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)\(arrays are `Iterable`\), or a promise of an `Iterable`, which produces promises (or a mix of promises and values), iterate over all the values in the `Iterable` into an array and iterate over the array serially, in-order.

Returns a promise for an array that contains the values returned by the `iterator` function in their respective positions. The iterator won't be called for an item until its previous item, and the promise returned by the iterator for that item are fulfilled. This results in a `mapSeries` kind of utility but it can also be used simply as a side effect iterator similar to [`Array#forEach`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach).

If any promise in the input array is rejected or any promise returned by the iterator function is rejected, the result will be rejected as well.

Example where [.mapSeries](.)\(the instance method\) is used for iterating with side effects:

```js
// Source: http://jakearchibald.com/2014/es7-async-functions/
function loadStory() {
  return getJSON('story.json')
    .then(function(story) {
      addHtmlToPage(story.heading);
      return story.chapterURLs.map(getJSON);
    })
    .mapSeries(function(chapter) { addHtmlToPage(chapter.html); })
    .then(function() { addTextToPage("All done"); })
    .catch(function(err) { addTextToPage("Argh, broken: " + err.message); })
    .then(function() { document.querySelector('.spinner').style.display = 'none'; });
}
```

<hr>
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = "Promise.mapSeries";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-promise.mapSeries";

    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
