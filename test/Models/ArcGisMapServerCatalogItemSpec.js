'use strict';

/*global require,describe,it,expect,beforeEach*/

var Terria = require('../../lib/Models/Terria');
var Legend = require('../../lib/Map/Legend');
var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');
var ArcGisMapServerCatalogItem = require('../../lib/Models/ArcGisMapServerCatalogItem');
var LegendUrl = require('../../lib/Map/LegendUrl');

var terria;
var item;

beforeEach(function() {
    terria = new Terria({
        baseUrl: './'
    });
    item = new ArcGisMapServerCatalogItem(terria);
});

describe('ArcGisMapServerCatalogItem', function() {

    beforeEach(function() {
        var realLoadWithXhr = loadWithXhr.load;
        // We replace calls to GA's servers with pre-captured JSON files so our testing is isolated, but reflects real data.
        spyOn(loadWithXhr, 'load').and.callFake(function(url, responseType, method, data, headers, deferred, overrideMimeType, preferText, timeout) {
            url = url.replace ('http://example.com/42/', '/Dynamic_National_Map_Hydrography_and_Marine/');
            if (url.match('Dynamic_National_Map_Hydrography_and_Marine/MapServer')) {
                url = url.replace(/^.*\/MapServer/, '/test/ArcGisMapServer/Dynamic_National_Map_Hydrography_and_Marine/MapServer');
                url = url.replace(/MapServer\/?\?f=json$/i, 'mapserver.json');
                url = url.replace(/MapServer\/Legend\/?\?f=json$/i, 'legend.json');
                url = url.replace(/MapServer\/Layers\/?\?f=json$/i, 'layers.json');
                url = url.replace(/MapServer\/31\/?\?f=json$/i, '31.json');
                arguments[0] = url;
            }
            return realLoadWithXhr.apply(undefined, arguments);
        });
    });

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

    it('defaults to having no dataUrl', function() {
        item.url = 'http://foo.bar';
        expect(item.dataUrl).toBeUndefined();
        expect(item.dataUrlType).toBeUndefined();
    });

    it('uses explicitly-provided dataUrl and dataUrlType', function() {
        item.dataUrl = 'http://foo.com/data';
        item.dataUrlType = 'wfs-complete';
        item.url = 'http://foo.com/somethingElse';
        expect(item.dataUrl).toBe('http://foo.com/data');
        expect(item.dataUrlType).toBe('wfs-complete');
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

        expect(item.legendUrl).toEqual(new LegendUrl('http://legend.com'));
        expect(item.dataUrlType).toBeUndefined();
        expect(item.dataUrl).toBeUndefined();
        expect(item.metadataUrl).toBe('http://my.metadata.com');
        expect(item.url).toBe('http://my.arcgis.com');
        expect(item.layers).toBe('mylayer');
        expect(item.maximumScale).toEqual(100);
        expect(item.maximumScaleBeforeMessage).toEqual(10);
        expect(item.showTilesAfterMessage).toBe(false);
    });

    it('falls back to /legend if no legendUrl provided in json', function() {
        item.updateFromJson({
            metadataUrl: 'http://my.metadata.com',
            url: 'http://my.arcgis.com/abc'
        });

        expect(item.legendUrl).toEqual(new LegendUrl('http://my.arcgis.com/abc/legend'));
    });

    it('can load /MapServer json for all layers', function(done) {
        var url = 'http://www.ga.gov.au/gis/rest/services/topography/Dynamic_National_Map_Hydrography_and_Marine/MapServer';
        item.updateFromJson({url: url});
        item.load().then(function() {
            expect(item.mapServerData.mapName).toEqual('Australian Topography - Hydrography and Marine');
            expect(item._layersData.layers.length).toBe(74);
            done();
        });
    });

    it('properly loads a single layer specified as MapServer/31', function(done) {
        var url = 'http://www.ga.gov.au/gis/rest/services/topography/Dynamic_National_Map_Hydrography_and_Marine/MapServer/31';
        item.updateFromJson({url: url});
        item.load().then(function() {
            expect(item._layersData.layers.length).toBe(1);
            expect(item._layersData.layers[0].name).toBe('Offshore_Rocks_And_Wrecks');
            done();
        });
    });

    it('is not confused by other numbers in url', function(done) {
        var url = 'http://www.ga.gov.au/gis/rest/services/42/and/3/topography/Dynamic_National_Map_Hydrography_and_Marine/MapServer/31';
        item.updateFromJson({url: url});
        item.load().then(function() {
            expect(item._layersData.layers.length).toBe(1);
            expect(item._layersData.layers[0].name).toBe('Offshore_Rocks_And_Wrecks');
            done();
        });
    });

    it('generates a legend with the right number of items', function(done) {
        var url = 'http://www.ga.gov.au/gis/rest/services/topography/Dynamic_National_Map_Hydrography_and_Marine/MapServer/31';
        item.updateFromJson({url: url});
        spyOn(Legend.prototype, 'asPngUrl').and.callFake(function(canvas) {
            expect(this.items.length).toBe(2);
            expect(this.items[1].title).toBe('Wrecks');
            console.log(this);
            return '';
        });
        item.load().then(function() {
            done();
        }).otherwise(fail);
    });

});
