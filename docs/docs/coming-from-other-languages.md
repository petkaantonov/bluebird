---
id: coming-from-other-languages
title: Coming from Other Languages
---

This page describes parallels of using promises in other languages. Promises as a pattern are very common in other languages and knowing what they map to in other languages might help you with grasping them conceptually

 - [C#](#c)
 - [Scala](#scala)
 - [Python](#python)
 - [C++](#c)
 - [Haskell](#haskell)
 - [Java](#java)
 - [Android Java](#android-java)
 - [Objective-C](#objective-c)


## C&#35;

A promise is similar to a C# `Task`. They both represent the result of an operation.

A promise's `then` method is similar to a Task's `ContinueWith` method in that both allow attaching a continuation to the promise. Bluebird's [Promise.coroutine](.) is analogous to C#'s `async/await` syntax.

A `TaskCompletionSource` is analogous to the promise constructor. Although usually promisification is preferred (see the API reference or working with callbacks section).

`Task.FromResult` is analogous to [Promise.resolve](.).

The difference between a `Task` and a promise are that a task might not be started and might require a `.Start` call where a promise always represents an already started operation.

In addition promises are always unwrapped. A promise implicitly has `Task.Unwrap` called on it - that is, promises perform recursive assimilation of promises within them.

See [this question on StackOverflow](http://stackoverflow.com/questions/26136389/how-can-i-realize-pattern-promise-deffered) for more differences.

##Scala

A bluebird promise is similar to a Scala `Future`. A scala `Promise` is similar to how the promise constructor can be used (previously, to a bluebird Deferred).

Just like a future, a promise represents a value over time. The value can resolve to either a fulfilled (ok completion) or rejected (error completion) state.

Where blocking on a Future in scala is discouraged, in JavaScript it's downright impossible.

In addition promises are always unwrapped. That is, promises perform recursive assimilation of promises within them. You can't have a `Promise<Promise<T>>` where a `Future[Future[T]]` is valid in Scala.

See [this question on StackOverflow](http://stackoverflow.com/questions/22724883/js-deferred-promise-future-compared-to-functional-languages-like-scala) for more differences.

##Python

A promise is similar to a Twisted Deferred object. In fact the first JavaScript implementations of promises were based on it. However, the APIs have diverged since. The mental model is still very similar.

A promise is _not_ similar to a Python `concurrent.Future` which does not chain actions.

Asyncio coroutines are similar to bluebird coroutines in what they let you do, however bluebird coroutines also enable functional-style chaining.

##C++

A bluebird promise is similar to a `std::future` and the promise constructor is similar to an `std::promise` although it should rarely be used in practice (see the promisification section).

However, a bluebird promise is more powerful than the current implementation of `std::future` since while chaining has been discussed it is not yet implemented. Promises can be chained together.

Boost futures expose a `.then` method similar to promises and allow this functionality.

##Haskell

A promise is a monadic construct with `.then` filling the role of `>>=` (bind). The major difference is that `.then` performs recursive assimilation which acts like a `flatMap` or a map. The type signature of `then` is quote complicated. If we omit the error argument and not throw - it's similar to:

```hs
then::Promise a -> a -> (Either (Promise b) b) -> Promise B
```

That is, you can return either a promise _or a plain value_ from a `then` without wrapping it.

Promises perform a role similar to `IO` in that they allow for easy chaining of asynchronous non-blocking operations. `Promise.coroutine` can be seen as similar to `do` notation although in practice it's not an accurate comparison.

##Java

A promise is similar to a guava `Future` with `chain` being similar to `then`.

If your'e familiar with Java 8 lambdas, you can think of a promise as a `Future` you can `map` to another future.

##Android Java

Several popular Android libraries use promises - for example the Parse Java API returns `Task`s which are similar to JavaScript promises.

##Objective-C

If you're familiar with PromiseKit, it is based on a same specification bluebird is based on so the API should feel familiar right away.
