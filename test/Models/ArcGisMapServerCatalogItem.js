'use strict';

/*global require,describe,it,expect,beforeEach*/

var Terria = require('../../lib/Models/Terria');
var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');
var ImageryLayerCatalogItem = require('../../lib/Models/ImageryLayerCatalogItem');
var ArcGisMapServerCatalogItem = require('../../lib/Models/ArcGisMapServerCatalogItem');

var terria;
var item;

beforeEach(function() {
    terria = new Terria({
        baseUrl: './'
    });
    item = new ArcGisMapServerCatalogItem(terria);
});

describe('ArcGisMapServerCatalogItemViewModel', function() {
    it('has sensible type and typeName', function() {
        expect(item.type).toBe('esri-mapServer');
        expect(item.typeName).toBe('Esri ArcGIS MapServer');
    });

    it('throws if constructed without a Terria instance', function() {
        expect(function() {
            var viewModel = new ArcGisMapServerCatalogItem(); // jshint ignore:line
        }).toThrow();
    });

    it('can be constructed', function() {
        expect(item).toBeDefined();
    });

    it('can update from json', function() {
        item.updateFromJson({
            legendUrl: 'http://legend.com',
            metadataUrl: 'http://my.metadata.com',
            url: 'http://my.arcgis.com',
            layers: 'mylayer',
            maximumScale: 100,
            maximumScaleBeforeMessage: 10,
            showTilesAfterMessage: false
        });

        expect(item.legendUrl).toBe('http://legend.com');
        expect(item.dataUrlType).toBeUndefined();
        expect(item.dataUrl).toBeUndefined();
        expect(item.metadataUrl).toBe('http://my.metadata.com');
        expect(item.url).toBe('http://my.arcgis.com');
        expect(item.layers).toBe('mylayer');
        expect(item.maximumScale).toEqual(100);
        expect(item.maximumScaleBeforeMessage).toEqual(10);
        expect(item.showTilesAfterMessage).toBe(false);
    });

    it('can load JSON', function(done) {
        item.updateFromJson({
            url: 'http://my.arcgis.com'
        });
        // item.load() ultimately calls loadWithXhr.load(), which just needs to return some json, so fake it
        spyOn(loadWithXhr, 'load').and.callFake(function(url, responseType, method, data, headers, deferred, overrideMimeType, preferText, timeout) {
            var json = '{"currentVersion": 1.1, "folders": ["Utilities"], "services": [{"name": "2014-Map", "type": "MapServer"}]}';
            deferred.resolve(json);
        });
        item.load().then(function() {
            expect(loadWithXhr.load).toHaveBeenCalled();
            done();
        });
        // .otherwise(function() {
        //     expect(loadWithXhr.load).toHaveBeenCalledWith('abc');
        //     done();
        // });
    });

});
