"use strict";

/*global require*/
var DeveloperError = require('../third_party/cesium/Source/Core/DeveloperError');
var when = require('../third_party/cesium/Source/ThirdParty/when');

function readText(file) {
    if (typeof file === 'undefined') {
        throw new DeveloperError('file is required');
    }

    var reader = new FileReader();
    reader.readAsText(file);
    var deferred = when.defer();
    reader.onload = function (event) {
        var allText = event.target.result;
        deferred.resolve(allText);
    };
    reader.onerror = function (e) {
        deferred.reject(e);
    };
    return deferred.promise;
}

module.exports = readText;