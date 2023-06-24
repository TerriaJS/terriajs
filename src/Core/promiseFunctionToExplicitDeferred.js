"use strict";

function promiseFunctionToExplicitDeferred(deferred, f, args) {
  try {
    deferred.resolve(f.apply(undefined, args));
  } catch (e) {
    deferred.reject(e);
  }
}

export default promiseFunctionToExplicitDeferred;
