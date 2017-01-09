'use strict';

function promiseFunctionToExplicitDeferred(deferred, f, args) {
    return function() {
        try {
            deferred.resolve(f.apply(undefined, args));
        } catch (e) {
            deferred.reject(e);
        }
    };
}

module.exports = promiseFunctionToExplicitDeferred;