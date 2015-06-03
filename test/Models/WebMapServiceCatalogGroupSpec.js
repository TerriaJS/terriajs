'use strict';

/*global require,describe,beforeEach,it,afterEach,expect*/
var Terria = require('../../lib/Models/Terria');
var WebMapServiceCatalogGroup = require('../../lib/Models/WebMapServiceCatalogGroup');

var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');
var GeographicTilingScheme = require('terriajs-cesium/Source/Core/GeographicTilingScheme');
var WebMercatorTilingScheme = require('terriajs-cesium/Source/Core/WebMercatorTilingScheme');

describe('WebMapServiceCatalogGroup', function() {
    var terria;
    var group;
    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        group = new WebMapServiceCatalogGroup(terria);
    });

    afterEach(function() {
        loadWithXhr.load = loadWithXhr.defaultLoad;
    });

    it('creates hierarchy of catalog items', function(done) {
        group.url = 'http://does.not.exist';

        loadWithXhr.load = function(url, responseType, method, data, headers, deferred, overrideMimeType, preferText) {
            expect(url).toContain('GetCapabilities');
            return loadWithXhr.defaultLoad('test/GetCapabilities/BOM.xml', responseType, method, data, headers, deferred, overrideMimeType, preferText);
        };

        group.load().then(function() {
            expect(group.items.length).toBe(9);

            var first = group.items[0];
            expect(first.items.length).toBe(5);
            expect(first.items[0].name).toContain('All');

            done();
        });
    });

    it('creates flat list of catalog items if requested', function(done) {
        group.url = 'http://does.not.exist';
        group.flatten = true;

        loadWithXhr.load = function(url, responseType, method, data, headers, deferred, overrideMimeType, preferText) {
            expect(url).toContain('GetCapabilities');
            return loadWithXhr.defaultLoad('test/GetCapabilities/BOM.xml', responseType, method, data, headers, deferred, overrideMimeType, preferText);
        };

        group.load().then(function() {
            expect(group.items.length).toBe(76);
            done();
        });
    });

    it('prefers Web Mercator if available', function(done) {
        group.url = 'http://does.not.exist';
        group.flatten = true;

        loadWithXhr.load = function(url, responseType, method, data, headers, deferred, overrideMimeType, preferText) {
            expect(url).toContain('GetCapabilities');
            return loadWithXhr.defaultLoad('test/GetCapabilities/WebMercatorAndGeographic.xml', responseType, method, data, headers, deferred, overrideMimeType, preferText);
        };

        group.load().then(function() {
            expect(group.items.length).toBe(1);
            expect(group.items[0]._createImageryProvider().tilingScheme instanceof WebMercatorTilingScheme).toBe(true);
            done();
        });
    });

    it('Use Geographic if Web Mercator is not available', function(done) {
        group.url = 'http://does.not.exist';
        group.flatten = true;

        loadWithXhr.load = function(url, responseType, method, data, headers, deferred, overrideMimeType, preferText) {
            expect(url).toContain('GetCapabilities');
            return loadWithXhr.defaultLoad('test/GetCapabilities/GeographicOnly.xml', responseType, method, data, headers, deferred, overrideMimeType, preferText);
        };

        group.load().then(function() {
            expect(group.items.length).toBe(1);
            expect(group.items[0]._createImageryProvider().tilingScheme instanceof GeographicTilingScheme).toBe(true);
            done();
        });
    });
});
