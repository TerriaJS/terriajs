"use strict";

/*global require*/
var readText = require('./readText');

var RuntimeError = require('terriajs-cesium/Source/Core/RuntimeError');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var parser = new DOMParser();

function readXml(file) {
    return when(readText(file), function(result) {
        var xml = parser.parseFromString(result, 'application/xml');
        if (!xml || !xml.documentElement || xml.getElementsByTagName('parsererror').length > 0) {
            throw new RuntimeError('The file does not contain valid XML.');
        }
        return xml;
    }, function(e) {
        throw e;
    });
}

module.exports = readXml;
