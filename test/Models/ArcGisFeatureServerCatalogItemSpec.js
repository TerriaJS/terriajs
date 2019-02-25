'use strict';

/*global require,describe,it,expect,beforeEach*/

var Terria = require('../../lib/Models/Terria');
var loadWithXhr = require('../../lib/Core/loadWithXhr');
var ArcGisFeatureServerCatalogItem = require('../../lib/Models/ArcGisFeatureServerCatalogItem');

describe('ArcGisFeatureServerCatalogItem', function() {
    var terria;
    var item;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        item = new ArcGisFeatureServerCatalogItem(terria);

        var realLoadWithXhr = loadWithXhr.load;
        // We replace calls to real servers with pre-captured JSON files so our testing is isolated, but reflects real data.
        spyOn(loadWithXhr, 'load').and.callFake(function(url, responseType, method, data, headers, deferred, overrideMimeType, preferText, timeout) {
            if (url.match('Wildfire/FeatureServer')) {
                url = url.replace(/^.*\/FeatureServer/, 'FeatureServer');
                url = url.replace(/FeatureServer\/query\?f=json&layerDefs=%7B1%3A%22.*%22%7D$/i, '1.json');
                arguments[0] = 'test/ArcGisFeatureServer/Wildfire/' + url;
            }
            return realLoadWithXhr.apply(undefined, arguments);
        });
    });

    it('has sensible type and typeName', function() {
        expect(item.type).toBe('esri-featureServer');
        expect(item.typeName).toBe('ArcGIS Feature Server');
    });

    it('throws if constructed without a Terria instance', function() {
        expect(function() {
            var viewModel = new ArcGisFeatureServerCatalogItem(); // eslint-disable-line no-unused-vars
        }).toThrow();
    });

    it('can be constructed', function() {
        expect(item).toBeDefined();
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
            url: 'http://my.arcgis.com',
        });
        expect(item.url).toBe('http://my.arcgis.com');
    });

    it('properly loads a single layer specified as FeatureServer/1', function(done) {
        var url = 'http://example.com/arcgis/rest/services/Wildfire/FeatureServer/1';
        item.updateFromJson({url: url});
        item.load().then(function() {
            expect(loadWithXhr.load.calls.count()).toEqual(1);
            expect(item._geoJsonItem).toBeDefined();
            var geoJsonData = item._geoJsonItem.data;
            expect(geoJsonData).toBeDefined();
            expect(geoJsonData.crs).toBeDefined();
            expect(geoJsonData.type).toEqual('FeatureCollection');
            expect(geoJsonData.features.length).toEqual(3);
            done();
        }).otherwise(function() {
            done.fail();
        });
    });

});
