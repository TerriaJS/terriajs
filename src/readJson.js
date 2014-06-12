"use strict";

/*global require,Cesium*/
var when = Cesium.when;

var readText = require('./readText');

function readJson(file) {
    return when(readText(file), function(result) {
        return JSON.parse(result);
    }, function(e) {
        throw e;
    });
}

module.exports = readJson;