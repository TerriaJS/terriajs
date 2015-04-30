'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');

var initializeTerria = function(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    initializeTerria.baseUrl = defaultValue(options.baseUrl, 'build/TerriaJS/');
    if (initializeTerria.baseUrl.indexOf('/') !== initializeTerria.baseUrl.length - 1) {
        initializeTerria.baseUrl += '/';
    }

    window.CESIUM_BASE_URL = defaultValue(options.cesiumBaseUrl, initializeTerria.baseUrl + 'build/Cesium/build/');
    if (window.CESIUM_BASE_URL.indexOf('/') !== window.CESIUM_BASE_URL.length - 1) {
        window.CESIUM_BASE_URL += '/';
    }

    // IE9 doesn't have a console object until the debugging tools are opened.
    // Add a shim.
    if (typeof window.console === 'undefined') {
        window.console = {
            log : function() {}
        };
    }
};

module.exports = initializeTerria;
