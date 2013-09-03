Promise.Error = PromiseError;
Promise.CancellationError = CancellationError;

Promise.ErrorHandlingMode = {
    ANY: {},
    PROMISE_ONLY: {}
};

Promise.errorHandlingMode = Promise.ErrorHandlingMode.ANY;