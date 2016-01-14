'use strict';

/*global require,describe,it,expect,beforeEach*/

var Terria = require('../../lib/Models/Terria');
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
        // item.load() ultimately calls loadWithXhr.load(), which just needs to return some json, so fake it
        spyOn(loadWithXhr, 'load').and.callFake(function(url, responseType, method, data, headers, deferred, overrideMimeType, preferText, timeout) {
            var json = '{"currentVersion": 1.1, "folders": ["Utilities"], "services": [{"name": "2014-Map", "type": "MapServer"}]}';
            deferred.resolve(json);
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

    it('can load json', function(done) {
        var url = 'http://my.arcgis.com/';
        item.updateFromJson({url: url});
        item.load().then(function() {
            // with this url, loadJson (and thus loadWithXhr) should have been called twice
            // once for the serviceUrl, which is the same as the url plus a query param
            // and once for the layersUrl, which is url/layers?...
            expect(loadWithXhr.load.calls.count()).toEqual(2);
            // this reg exp allows for optional / at end of url and after /layers
            var load1 = (new RegExp(url + '\/?\\?')).test(loadWithXhr.load.calls.argsFor(0)[0]);
            var load2 = (new RegExp(url + '\/{0,2}layers\/?\\?')).test(loadWithXhr.load.calls.argsFor(1)[0]);
            expect(load1).toBe(true);
            expect(load2).toBe(true);
            done();
        });
        // .otherwise(function() {
        //     expect(loadWithXhr.load).toHaveBeenCalledWith('abc');
        //     done();
        // });
    });

    it('properly loads MapServer/3', function(done) {
        var url = 'http://my.arcgis.com/MapServer/3'; // do not put a / at the end, number must be one digit
        item.updateFromJson({url: url});
        item.load().then(function() {
            // with this url, loadJson (and thus loadWithXhr) should have been called twice
            // once for the serviceUrl, which is the same as the url plus a query param
            // and once for the layersUrl, which is the same url again
            expect(loadWithXhr.load.calls.count()).toEqual(2);
            // this reg exp allows for optional / at end of url and after /layers
            var re = new RegExp(url.substr(0, url.length-1) + '\/?\\?');   // the first url will be missing the number
            var load1 = re.test(loadWithXhr.load.calls.argsFor(0)[0]);
            var re2 = new RegExp(url + '\/?\\?');
            var load2 = re2.test(loadWithXhr.load.calls.argsFor(1)[0]);
            expect(load1).toBe(true);
            expect(load2).toBe(true);
            done();
        });
    });

    it('properly loads with numbers in url', function(done) {
        var url = 'http://my.arcgis.com/33/MapServer';
        item.updateFromJson({url: url});
        item.load().then(function() {
            // this reg exp allows for optional / at end of url and after /layers
            var load2 = (new RegExp(url + '\/{0,2}layers\/?\\?')).test(loadWithXhr.load.calls.argsFor(1)[0]);
            expect(load2).toBe(true);
            done();
        });
    });

});
