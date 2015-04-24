"use strict";

/*global require*/
var readText = require('./readText');

var when = require('terriajs-cesium/Source/ThirdParty/when');

var parser = new DOMParser();

function readXml(file) {
    return when(readText(file), function(result) {
        return parser.parseFromString(result, 'application/xml');
    }, function(e) {
        throw e;
    });
}

module.exports = readXml;
