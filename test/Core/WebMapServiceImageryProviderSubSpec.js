/*global require,describe,it,expect,afterEach*/

'use strict';

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var getTimestamp = require('terriajs-cesium/Source/Core/getTimestamp');
var loadImage = require('terriajs-cesium/Source/Core/loadImage');
var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');
var ImageryLayerFeatureInfo = require('terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo');
var WebMapServiceImageryProvider = require('terriajs-cesium/Source/Scene/WebMapServiceImageryProvider');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var pollToPromise = function(f, options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    var pollInterval = defaultValue(options.pollInterval, 1);
    var timeout = defaultValue(options.timeout, 5000);

    var deferred = when.defer();

    var startTimestamp = getTimestamp();
    var endTimestamp = startTimestamp + timeout;

    function poller() {
        if (f()) {
            deferred.resolve();
        } else {
            if (getTimestamp() > endTimestamp) {
                deferred.reject();
            } else {
                setTimeout(poller, pollInterval);
            }
        }
    }

    poller();

    return deferred.promise;
};


afterEach(function() {
    loadImage.createImage = loadImage.defaultCreateImage;
    loadWithXhr.load = loadWithXhr.defaultLoad;
});

describe('pickFeatures', function() {

    it('works with Esri WMS responses', function() {
        var provider = new WebMapServiceImageryProvider({
            url: 'made/up/wms/server',
            layers: 'someLayer'
        });

        loadWithXhr.load = function(url, responseType, method, data, headers, deferred, overrideMimeType) {
            expect(url).toContain('GetFeatureInfo');
            loadWithXhr.defaultLoad('Data/WMS/GetFeatureInfo-Esri.xml', responseType, method, data, headers, deferred, overrideMimeType);
        };

        return pollToPromise(function() {
            return provider.ready;
        }).then(function() {
            return provider.pickFeatures(0, 0, 0, 0.5, 0.5).then(function(pickResult) {
                expect(pickResult.length).toBe(1);

                var firstResult = pickResult[0];
                expect(firstResult).toBeInstanceOf(ImageryLayerFeatureInfo);
                expect(firstResult.name).toBe('Kyogle (A)');
                expect(firstResult.description).toContain('New South Wales');
            });
        });
    });

    it('works with THREDDS XML format', function() {
        var provider = new WebMapServiceImageryProvider({
            url: 'made/up/wms/server',
            layers: 'someLayer'
        });

        loadWithXhr.load = function(url, responseType, method, data, headers, deferred, overrideMimeType) {
            expect(url).toContain('GetFeatureInfo');
            loadWithXhr.defaultLoad('Data/WMS/GetFeatureInfo-THREDDS.xml', responseType, method, data, headers, deferred, overrideMimeType);
        };

        return pollToPromise(function() {
            return provider.ready;
        }).then(function() {
            return provider.pickFeatures(0, 0, 0, 0.5, 0.5).then(function(pickResult) {
                expect(pickResult.length).toBe(1);

                var firstResult = pickResult[0];
                expect(firstResult).toBeInstanceOf(ImageryLayerFeatureInfo);
                expect(+firstResult.properties.value).toBe(42);
                expect(firstResult.description).toContain('42');
            });
        });
    });

    it('works with msGMLOutput format', function() {
        var provider = new WebMapServiceImageryProvider({
            url: 'made/up/wms/server',
            layers: 'someLayer'
        });

        loadWithXhr.load = function(url, responseType, method, data, headers, deferred, overrideMimeType) {
            expect(url).toContain('GetFeatureInfo');
            loadWithXhr.defaultLoad('Data/WMS/GetFeatureInfo-msGMLOutput.xml', responseType, method, data, headers, deferred, overrideMimeType);
        };

        return pollToPromise(function() {
            return provider.ready;
        }).then(function() {
            return provider.pickFeatures(0, 0, 0, 0.5, 0.5).then(function(pickResult) {
                expect(pickResult.length).toBe(1);

                var firstResult = pickResult[0];
                expect(firstResult).toBeInstanceOf(ImageryLayerFeatureInfo);
                expect(firstResult.name).toBe('Hovercraft');
                expect(firstResult.description).toContain('Hovercraft');
            });
        });
    });
});