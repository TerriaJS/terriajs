'use strict';

/*global require*/

var when = require('../../third_party/cesium/Source/ThirdParty/when');

var runLater = function(functionToRunLater) {
    var deferred = when.defer();
    setTimeout(function() {
        deferred.resolve(functionToRunLater());
    }, 0);
    return deferred.promise;
};

module.exports = runLater;
