'use strict';

/*global require,describe,it,expect,beforeEach*/

var Terria = require('../../lib/Models/Terria');
var Legend = require('../../lib/Map/Legend');
var loadWithXhr = require('../../lib/Core/loadWithXhr');
var ArcGisMapServerCatalogItem = require('../../lib/Models/ArcGisMapServerCatalogItem');
var LegendUrl = require('../../lib/Map/LegendUrl');

describe('ArcGisMapServerCatalogItem', function() {
    var terria;
    var item;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        item = new ArcGisMapServerCatalogItem(terria);

        var realLoadWithXhr = loadWithXhr.load;
        // We replace calls to GA's servers with pre-captured JSON files so our testing is isolated, but reflects real data.
        spyOn(loadWithXhr, 'load').and.callFake(function(url, responseType, method, data, headers, deferred, overrideMimeType, preferText, timeout) {
            url = url.replace ('http://example.com/42/', '');
            if (url.match('Dynamic_National_Map_Hydrography_and_Marine/MapServer')) {
                url = url.replace(/^.*\/MapServer/, 'MapServer');
                url = url.replace(/MapServer\/?\?f=json$/i, 'mapserver.json');
                url = url.replace(/MapServer\/Legend\/?\?f=json$/i, 'legend.json');
                url = url.replace(/MapServer\/Layers\/?\?f=json$/i, 'layers.json');
                url = url.replace(/MapServer\/31\/?\?f=json$/i, '31.json');
                arguments[0] = 'test/ArcGisMapServer/Dynamic_National_Map_Hydrography_and_Marine/' + url;
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
            var viewModel = new ArcGisMapServerCatalogItem(); // eslint-disable-line no-unused-vars
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

    describe('after updating metadata', function() {
        describe('copyright text', function() {
            it('comes from layer json if valid', function() {
                update({copyrightText: 'server copyright text'}, {copyrightText: 'layer copyright text'});

                expect(item.info[0].name).toBe('Copyright Text');
                expect(item.info[0].content).toBe('layer copyright text');
            });

            it('reverts to server json layer json if undefined', function() {
                update({copyrightText: 'server copyright text'}, {});

                expect(item.info[0].name).toBe('Copyright Text');
                expect(item.info[0].content).toBe('server copyright text');
            });

            it('reverts to server json layer json if empty string', function() {
                update({copyrightText: 'server copyright text'}, {copyrightText: ''});

                expect(item.info[0].name).toBe('Copyright Text');
                expect(item.info[0].content).toBe('server copyright text');
            });

            it('adds nothing if neither server or layer json has copyright text', function() {
                update({}, {});

                expect(item.info.length).toBe(0);
            });

            function update(serverJson, layerJson) {
                item._legendUrl = '';
                item.updateFromMetadata(serverJson, {layers: [layerJson]}, undefined, true, layerJson);

            }
        });
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
            // with this url, loadJson (and thus loadWithXhr) should have been called twice
            // once for the serviceUrl, which is the same as the url plus a query param
            // and once for the layersUrl, which is url/layers?...
            expect(loadWithXhr.load.calls.count()).toBeGreaterThan(1);
            // this reg exp allows for optional / at end of url and after /layers
            var load1 = (new RegExp(url + '\/?\\?')).test(loadWithXhr.load.calls.argsFor(0)[0]);
            var load2 = (new RegExp(url + '\/{0,2}layers\/?\\?')).test(loadWithXhr.load.calls.argsFor(1)[0]);
            expect(load1).toBe(true);
            expect(load2).toBe(true);
            done();
        });
    });

    it('properly loads a single layer specified as MapServer/31', function(done) {
        var url = 'http://www.ga.gov.au/gis/rest/services/topography/Dynamic_National_Map_Hydrography_and_Marine/MapServer/31';
        item.updateFromJson({url: url});
        item.load().then(function() {
            // with this url, loadJson (and thus loadWithXhr) should have been called twice
            // once for the serviceUrl, which is the same as the url plus a query param
            // and once for the layersUrl, which is the same url again
            expect(loadWithXhr.load.calls.count()).toBeGreaterThan(1);
            // this reg exp allows for optional / at end of url and after /layers
            var re = new RegExp(url.substr(0, url.length-3) + '\/?\\?');   // the first url will be missing the number
            var load1 = re.test(loadWithXhr.load.calls.argsFor(0)[0]);
            var re2 = new RegExp(url + '\/?\\?');
            var load2 = re2.test(loadWithXhr.load.calls.argsFor(1)[0]);
            expect(load1).toBe(true);
            expect(load2).toBe(true);
            done();
        });
    });

    it('is not confused by other numbers in url', function(done) {
        var url = 'http://www.ga.gov.au/gis/rest/services/42/and/3/topography/Dynamic_National_Map_Hydrography_and_Marine/MapServer/31';
        item.updateFromJson({url: url});
        item.load().then(function() {
            // this reg exp allows for optional / at end of url and after /layers
            var load2 = (new RegExp(url + '\\?')).test(loadWithXhr.load.calls.argsFor(1)[0]);
            expect(load2).toBe(true);
            done();
        });
    });

    it('generates a legend with the right number of items', function(done) {
        var url = 'http://www.ga.gov.au/gis/rest/services/topography/Dynamic_National_Map_Hydrography_and_Marine/MapServer/31';
        item.updateFromJson({url: url});
        spyOn(Legend.prototype, 'drawSvg').and.callFake(function() {
            expect(this.items.length).toBe(2);
            expect(this.items[0].title).toBe('Wrecks');
            expect(this.items[1].title).toBe('Offshore Rocks');
            console.log(this);
            return '';
        });
        item.load().then(function() {
            done();
        }).otherwise(fail);
    });

});
