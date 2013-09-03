Promise.Error = PromiseError;
Promise.CancelException = CancelException;

Promise.ErrorHandlingMode = {
    ANY: {},
    PROMISE_ONLY: {}
};

Promise.errorHandlingMode = Promise.ErrorHandlingMode.ANY;