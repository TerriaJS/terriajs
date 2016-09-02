"use strict";

/*global require*/
var json5 = require('json5');
var readText = require('./readText');

var when = require('terriajs-cesium/Source/ThirdParty/when');

function readJson(file) {
    return when(readText(file), function(result) {
        return json5.parse(result);
    }, function(e) {
        throw e;
    });
}

module.exports = readJson;
