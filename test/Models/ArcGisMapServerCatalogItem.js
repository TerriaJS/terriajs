'use strict';

/*global require,describe,it,expect,beforeEach*/

var Terria = require('../../lib/Models/Terria');
var ImageryLayerCatalogItem = require('../../lib/Models/ImageryLayerCatalogItem');
var ArcGisMapServerCatalogItem = require('../../lib/Models/ArcGisMapServerCatalogItem');
var WebMercatorTilingScheme = require('terriajs-cesium/Source/Core/WebMercatorTilingScheme');

var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var Credit = require('terriajs-cesium/Source/Core/Credit');

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

});
