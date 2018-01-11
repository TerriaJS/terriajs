const when = require('terriajs-cesium/Source/ThirdParty/when');
const runLater = require('./runLater');

class Promise {
    constructor(callback) {
        this._deferred = when.defer();
        this._resolved = false;
        callback(val => this._deferred.resolve(val), err => this._deferred.reject(err));
        this._deferred.promise.then(()=> { this._resolved = true; });
    }
    catch(onRejected) {
        return Promise.resolve(this._deferred.promise.otherwise(onRejected));
    }
    then(onFulfilled, onRejected) {
        if (this._resolved) {
            // Cesium's whenjs immediately calls .then functions on resolved promises
            // The ECMA standard requires calling them later
            return Promise.resolve(runLater(() => this._deferred.promise.then(onFulfilled, onRejected)));
        }
        else {
            return Promise.resolve(this._deferred.promise.then(onFulfilled, onRejected));
        }
    }
}

Promise.all = function(promises) {
    Promise.resolve(when.all(promises));
};

Promise.race = function(promises) {
    Promise.resolve(when.race(promises));
};

Promise.reject = function(err) {
    return new Promise((resolve, reject) => { reject(err); });
};

Promise.resolve = function(val) {
    return new Promise((resolve, reject) => { resolve(val); });
};

module.exports = Promise;
