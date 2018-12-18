---
layout: api
id: each
title: .each
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.each

```js
.each(function(any item, int index, int length) iterator) -> Promise
```

Iterate over an array, or a promise of an array, which contains promises (or a mix of promises and values) with the given `iterator` function with the signature `(value, index, length)` where `value` is the resolved value of a respective promise in the input array. Iteration happens serially. If any promise in the input array is rejected the returned promise is rejected as well.

Resolves to the original array unmodified, this method is meant to be used for side effects. If the iterator function returns a promise or a thenable, then the result of the promise is awaited, before continuing with next iteration.

Example where you might want to utilize `.each`:

```js
// Source: http://jakearchibald.com/2014/es7-async-functions/
function loadStory() {
  return getJSON('story.json')
    .then(function(story) {
      addHtmlToPage(story.heading);
      return story.chapterURLs.map(getJSON);
    })
    .each(function(chapter) { addHtmlToPage(chapter.html); })
    .then(function() { addTextToPage("All done"); })
    .catch(function(err) { addTextToPage("Argh, broken: " + err.message); })
    .then(function() { document.querySelector('.spinner').style.display = 'none'; });
}
```

</markdown></div>
