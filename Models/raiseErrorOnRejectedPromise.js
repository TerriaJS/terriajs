'use strict';

/*global require*/

var defined = require('../Cesium/Source/Core/defined');
var DeveloperError = require('../Cesium/Source/Core/DeveloperError');

var raiseErrorToUser = require('./raiseErrorToUser');

var raiseErrorOnRejectedPromise = function(application, promise) {
    if (!defined(application)) {
        throw new DeveloperError('application is required.');
    }

    if (defined(promise)) {
        return promise.otherwise(function(e) {
            raiseErrorToUser(application, e);
        });
    }
};

module.exports = raiseErrorOnRejectedPromise;