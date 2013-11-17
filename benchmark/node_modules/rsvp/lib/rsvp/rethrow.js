var local = (typeof global === "undefined") ? this : global;

function rethrow(reason) {
  local.setTimeout(function() {
    throw reason;
  });
  throw reason;
}

export { rethrow };
