'use strict';

/*global require*/

var when = require('terriajs-cesium/Source/ThirdParty/when');

var runLater = function(functionToRunLater) {
    var deferred = when.defer();
    setTimeout(function() {
        try {
            deferred.resolve(functionToRunLater());
        } catch (e) {
            deferred.reject(e);
        }
    }, 0);
    return deferred.promise;
};

module.exports = runLater;
