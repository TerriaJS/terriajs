"use strict";
/* global require  */

var json5 = require('json5');
var loadText = require('terriajs-cesium/Source/Core/loadText');
var defined = require('terriajs-cesium/Source/Core/defined');
var clone = require('terriajs-cesium/Source/Core/clone');

var defaultHeaders = {
    Accept : 'application/json5,application/json;q=0.8,*/*;q=0.01'
};
/*
 * A modified version of Cesium's loadJson function, supporting the more flexible JSON5 specification.
 */

function loadJson5(url, headers) {
    
    if (!defined(headers)) {
        headers = defaultHeaders;
    } else if (!defined(headers.Accept)) {
        // clone before adding the Accept header
        headers = clone(headers);
        headers.Accept = defaultHeaders.Accept;
    }

    return loadText(url, headers).then(function(value) {
        return json5.parse(value);
    });
}

module.exports = loadJson5;