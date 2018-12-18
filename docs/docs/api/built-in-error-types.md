---
layout: api
id: built-in-error-types
title: Built-in error types
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##Built-in error types

Bluebird includes a few built-in error types for common usage. All error types have the same identity across different copies of bluebird
module so that pattern matching works in [`.catch`](.). All error types have a constructor taking a message string as their first argument, with that message
becoming the `.message` property of the error object.

By default the error types need to be referenced from the Promise constructor, e.g. to get a reference to [TimeoutError](.), do `var TimeoutError = Promise.TimeoutError`. However, for convenience you will probably want to just make the references global.
</markdown></div>
