"use strict";

/*global require*/
var readText = require('./readText');

var when = require('../../third_party/cesium/Source/ThirdParty/when');

function readJson(file) {
    return when(readText(file), function(result) {
        return JSON.parse(result);
    }, function(e) {
        throw e;
    });
}

module.exports = readJson;
