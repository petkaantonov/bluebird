//This is pretty lame but what you gonna do

//async.js
CONSTANT(LATE_QUEUE_CAPACITY, 16);
CONSTANT(NORMAL_QUEUE_CAPACITY, 16);

//errors.js
CONSTANT(ERROR_HANDLED_KEY, "__promiseHandled__");
CONSTANT(OPERATIONAL_ERROR_KEY, "isOperational");
CONSTANT(DEFAULT_STATE, 0);
CONSTANT(STACK_ATTACHED, 1);
CONSTANT(ERROR_HANDLED, 2);

//join.js
CONSTANT(GENERATED_CLASS_COUNT, 8);

//promise.js
CONSTANT(USE_BOUND, true);
CONSTANT(DONT_USE_BOUND, false);

CONSTANT(PROPAGATE_CANCEL, 1);
CONSTANT(PROPAGATE_BIND, 2);
CONSTANT(PROPAGATE_ALL, PROPAGATE_CANCEL | PROPAGATE_BIND);

CONSTANT(CALLBACK_FULFILL_OFFSET, 0);
CONSTANT(CALLBACK_REJECT_OFFSET, 1);
CONSTANT(CALLBACK_PROMISE_OFFSET, 2);
CONSTANT(CALLBACK_RECEIVER_OFFSET, 3);
CONSTANT(CALLBACK_SIZE, 4);
//Layout for ._bitField
//[RR]RO GWFN CTBH IUDE LLLL LLLL LLLL LLLL
//[RR] = [Reserved] (Both bits are either on or off to represent
//                    1 bit due to 31-bit integers in 32-bit v8)
//R = [Reserved]
//O = returnedNonUndefined
//G = isAsyncGuaranteed
//W = isFollowing (The promise that is being followed is not stored explicitly)
//F = isFulfilled
//N = isRejected
//C = isCancellable
//T = isFinal (used for .done() implementation)
//B = isBound
//I = isRejectionIgnored
//H = isRejectionUnhandled
//U = isUnhanldedRejectionNotified
//D = isDisposable
//E = isCancelled
//L = Length, 16 bit unsigned
CONSTANT(NO_STATE, 0x0|0);
CONSTANT(RETURNED_NON_UNDEFINED, 0x10000000|0);
CONSTANT(IS_ASYNC_GUARANTEED, 0x8000000|0);
CONSTANT(IS_FOLLOWING, 0x4000000|0);
CONSTANT(IS_FULFILLED, 0x2000000|0);
CONSTANT(IS_REJECTED, 0x1000000|0);
CONSTANT(IS_CANCELLABLE, 0x800000|0);
CONSTANT(IS_FINAL, 0x400000|0);
CONSTANT(IS_BOUND, 0x200000|0);
CONSTANT(IS_REJECTION_UNHANDLED, 0x100000|0);
CONSTANT(IS_REJECTION_IGNORED, 0x80000|0);
CONSTANT(IS_UNHANDLED_REJECTION_NOTIFIED, 0x40000|0);
CONSTANT(IS_DISPOSABLE, 0x20000|0);
CONSTANT(IS_CANCELLED, 0x10000|0);
CONSTANT(LENGTH_MASK, 0xFFFF|0);
CONSTANT(LENGTH_CLEAR_MASK, ~LENGTH_MASK);
CONSTANT(MAX_LENGTH, LENGTH_MASK);
CONSTANT(IS_REJECTED_OR_CANCELLED, IS_REJECTED | IS_CANCELLED);
CONSTANT(IS_REJECTED_OR_FULFILLED, IS_REJECTED | IS_FULFILLED);
CONSTANT(IS_REJECTED_OR_FULFILLED_OR_CANCELLED, IS_REJECTED | IS_FULFILLED| IS_CANCELLED);
CONSTANT(IS_PENDING_AND_WAITING_NEG, IS_REJECTED_OR_FULFILLED_OR_CANCELLED);

CONSTANT(IS_FATE_SEALED, IS_REJECTED | IS_FULFILLED | IS_FOLLOWING | IS_CANCELLED);

CONSTANT(AFTER_PROMISIFIED_SUFFIX, "Async");
CONSTANT(UNHANDLED_REJECTION_EVENT, "unhandledRejection");
CONSTANT(REJECTION_HANDLED_EVENT, "rejectionHandled");

//promise_array.js
//MUST BE NEGATIVE NUMBERS
CONSTANT(RESOLVE_UNDEFINED, -1);
CONSTANT(RESOLVE_ARRAY, -2);
CONSTANT(RESOLVE_OBJECT, -3);
CONSTANT(RESOLVE_FOREVER_PENDING, -4);
CONSTANT(RESOLVE_CALL_METHOD, -5);

//queue.js
CONSTANT(QUEUE_MAX_CAPACITY, (1 << 30) | 0);
CONSTANT(QUEUE_MIN_CAPACITY, 16);

//captured_trace.js
CONSTANT(FROM_PREVIOUS_EVENT, "From previous event:");
CONSTANT(NO_STACK_TRACE, "    (No stack trace)");
CONSTANT(ADDITIONAL_STACK_TRACE, "^--- With additional stack trace: ");
CONSTANT(UNHANDLED_REJECTION_HEADER, "Unhandled rejection ");

//finally.js
CONSTANT(FINALLY_TYPE, 0);
CONSTANT(TAP_TYPE, 1);

//direct_resolve.js
CONSTANT(THROW, 1);
CONSTANT(RETURN, 2);

//promisify.js
CONSTANT(MAX_PARAM_COUNT, 1023);
CONSTANT(PARAM_COUNTS_TO_TRY, 3);

//error.js
CONSTANT(BLUEBIRD_ERRORS, "__BluebirdErrorTypes__");

//deprecated
CONSTANT(OBJECT_PROMISIFY_DEPRECATED, "Promise.promisify for promisifying entire objects is deprecated. Use Promise.promisifyAll instead.\n\n\
    See http://goo.gl/MqrFmX");
CONSTANT(SPAWN_DEPRECATED, "Promise.spawn is deprecated. Use Promise.coroutine instead.");

//errors
CONSTANT(LATE_CANCELLATION_OBSERVER, "late cancellation observer");
CONSTANT(TIMEOUT_ERROR, "operation timed out");
CONSTANT(COLLECTION_ERROR,  "expecting an array or an iterable object but got ");
CONSTANT(OBJECT_ERROR,  "expecting an object but got ");
CONSTANT(FUNCTION_ERROR,  "expecting a function but got ");
CONSTANT(CONSTRUCT_ERROR_INVOCATION, "the promise constructor cannot be invoked directly\n\n\
    See http://goo.gl/MqrFmX\n");
CONSTANT(NOT_GENERATOR_ERROR, "generatorFunction must be a function\n\n\
    See http://goo.gl/MqrFmX\n");
CONSTANT(LONG_STACK_TRACES_ERROR, "cannot enable long stack traces after promises have been created\n\n\
    See http://goo.gl/MqrFmX\n");
CONSTANT(INSPECTION_VALUE_ERROR, "cannot get fulfillment value of a non-fulfilled promise\n\n\
    See http://goo.gl/MqrFmX\n");
CONSTANT(INSPECTION_REASON_ERROR, "cannot get rejection reason of a non-rejected promise\n\n\
    See http://goo.gl/MqrFmX\n");
CONSTANT(PROMISIFY_TYPE_ERROR, "the target of promisifyAll must be an object or a function\n\n\
    See http://goo.gl/MqrFmX\n");
CONSTANT(CIRCULAR_RESOLUTION_ERROR, "circular promise resolution chain\n\n\
    See http://goo.gl/MqrFmX\n");
CONSTANT(PROPS_TYPE_ERROR, "cannot await properties of a non-object\n\n\
    See http://goo.gl/MqrFmX\n");
CONSTANT(POSITIVE_INTEGER_ERROR, "expecting a positive integer\n\n\
    See http://goo.gl/MqrFmX\n");
CONSTANT(YIELDED_NON_PROMISE_ERROR, "A value %s was yielded that could not be treated as a promise\n\n\
    See http://goo.gl/MqrFmX\n\n");
CONSTANT(FROM_COROUTINE_CREATED_AT, "From coroutine:\n");
CONSTANT(UNBOUND_RESOLVER_INVOCATION, "Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\n\n\
    See http://goo.gl/MqrFmX\n");
CONSTANT(PROMISIFICATION_NORMAL_METHODS_ERROR, "Cannot promisify an API that has normal methods with '%s'-suffix\n\n\
    See http://goo.gl/MqrFmX\n");
CONSTANT(SUFFIX_NOT_IDENTIFIER, "suffix must be a valid identifier\n\n\
    See http://goo.gl/MqrFmX\n");
CONSTANT(NO_ASYNC_SCHEDULER, "No async scheduler available\n\n\
    See http://goo.gl/MqrFmX\n");
