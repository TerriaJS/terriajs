'use strict';

/*global require,describe,it,expect,beforeEach,fail*/

var ImageryProvider = require('terriajs-cesium/Source/Scene/ImageryProvider');
var Terria = require('../../lib/Models/Terria');
var LegendUrl = require('../../lib/Map/LegendUrl');
var ImageryLayerCatalogItem = require('../../lib/Models/ImageryLayerCatalogItem');
var WebMapServiceCatalogItem = require('../../lib/Models/WebMapServiceCatalogItem');
var WebMercatorTilingScheme = require('terriajs-cesium/Source/Core/WebMercatorTilingScheme');

var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var Credit = require('terriajs-cesium/Source/Core/Credit');

var terria;
var wmsItem;

beforeEach(function() {
    terria = new Terria({
        baseUrl: './'
    });
    wmsItem = new WebMapServiceCatalogItem(terria);
});

describe('WebMapServiceCatalogItem', function() {
    it('has sensible type and typeName', function() {
        expect(wmsItem.type).toBe('wms');
        expect(wmsItem.typeName).toBe('Web Map Service (WMS)');
    });

    it('throws if constructed without a Terria instance', function() {
        expect(function() {
            var viewModel = new WebMapServiceCatalogItem(); // eslint-disable-line no-unused-vars
        }).toThrow();
    });

    it('can be constructed', function() {
        expect(wmsItem).toBeDefined();
    });

    it('is derived from ImageryLayerDataItemViewModel', function() {
        expect(wmsItem instanceof ImageryLayerCatalogItem).toBe(true);
    });

    describe('legendUrls', function() {
        it('is used when explicitly-provided', function() {
            wmsItem.legendUrl = new LegendUrl('http://foo.com/legend.png');
            wmsItem.url = 'http://foo.com/somethingElse';
            expect(wmsItem.legendUrl).toEqual(new LegendUrl('http://foo.com/legend.png'));
        });

        it('is derived from url if not explicitly provided or read from XML', function(done) {
            wmsItem.updateFromJson({
                url: 'http://foo.com/bar',
                metadataUrl: 'test/WMS/no_legend_url.xml',
                layers: 'single_period'
            });
            wmsItem.load().then(function() {
                expect(wmsItem.legendUrl.url.indexOf('http://foo.com/bar')).toBe(0);
                done();
            }).otherwise(function(e) {
                fail(e);
                done();
            });
        });

        it('incorporates parameters if legendUrl comes from style', function(done) {
            wmsItem.updateFromJson({
                url: 'http://example.com',
                metadataUrl: 'test/WMS/multiple_style_legend_url.xml',
                layers: 'single_period',
                parameters: { "styles": "jet2",
                              "foo": "bar" }
            });
            wmsItem.load().then(function() {
                expect(wmsItem.legendUrl).toEqual(new LegendUrl('http://www.example.com/foo?request=GetLegendGraphic&secondUrl&styles=jet2&foo=bar', 'image/gif'));
                done();
            }).otherwise(function(e) {
                fail(e);
                done();
            });

        });

        it('incorporates parameters if legendUrl is created from scratch', function(done) {
            wmsItem.updateFromJson({
                url: 'http://foo.com/bar',
                metadataUrl: 'test/WMS/no_legend_url.xml',
                layers: 'single_period',
                parameters: { "alpha": "beta",
                              "foo": "bar" }
            });
            wmsItem.load().then(function() {
                expect(wmsItem.legendUrl.url.indexOf('http://foo.com/bar?service=WMS&version=1.1.0&request=GetLegendGraphic&format=image%2Fpng&transparent=True&layer=single_period&alpha=beta&foo=bar')).toBe(0);
                done();
            }).otherwise(function(e) {
                fail(e);
                done();
            });

        });

        it('is read from XML when specified with a single style', function(done) {
            wmsItem.updateFromJson({
                url: 'http://example.com',
                metadataUrl: 'test/WMS/single_style_legend_url.xml',
                layers: 'single_period'
            });
            wmsItem.load().then(function() {
                expect(wmsItem.legendUrl).toEqual(new LegendUrl('http://www.example.com/foo?request=GetLegendGraphic&firstUrl', 'image/gif'));
                done();
            }).otherwise(function(e) {
                fail(e);
                done();
            });
        });

        it('is read from the first style tag when XML specifies multiple styles for a layer, provided style is unspecified', function(done) {
            wmsItem.updateFromJson({
                url: 'http://example.com',
                metadataUrl: 'test/WMS/multiple_style_legend_url.xml',
                layers: 'single_period'
            });
            wmsItem.load().then(function() {
                expect(wmsItem.legendUrl).toEqual(new LegendUrl('http://www.example.com/foo?request=GetLegendGraphic&firstUrl', 'image/gif'));
                done();
            }).otherwise(function(e) {
                fail(e);
                done();
            });
        });

        it('is read from the first LegendURL tag when XML specifies multiple LegendURL tags for a style', function(done) {
            wmsItem.updateFromJson({
                url: 'http://example.com',
                metadataUrl: 'test/WMS/single_style_multiple_legend_urls.xml',
                layers: 'single_period'
            });
            wmsItem.load().then(function() {
                expect(wmsItem.legendUrl).toEqual(new LegendUrl('http://www.example.com/foo?request=GetLegendGraphic&firstUrl', 'image/gif'));
                done();
            }).otherwise(function(e) {
                fail(e);
                done();
            });
        });


        it('is not overridden by the XML value when set manually', function(done) {
            wmsItem.updateFromJson({
                url: 'http://example.com',
                metadataUrl: 'test/WMS/single_style_legend_url.xml',
                layers: 'single_period'
            });

            wmsItem.legendUrl = new LegendUrl('http://www.example.com/blahFace');

            wmsItem.load().then(function() {
                expect(wmsItem.legendUrl).toEqual(new LegendUrl('http://www.example.com/blahFace'));
                done();
            }).otherwise(function(e) {
                fail(e);
                done();
            });
        });
    });

    describe('metadata urls', function() {
        it('are parsed when one is present', function(done) {
            wmsItem.updateFromJson({
                url: 'http://foo.com/bar',
                metadataUrl: 'test/WMS/single_metadata_url.xml',
                layers: 'single_period'
            });
            wmsItem.load().then(function() {
                expect(wmsItem.findInfoSection('Metadata Links').content).toBe('http://examplemetadata.com');
            }).then(done).otherwise(fail);
        });

        it('are parsed when multiple are present', function(done) {
            wmsItem.updateFromJson({
                url: 'http://foo.com/bar',
                metadataUrl: 'test/WMS/multiple_metadata_url.xml',
                layers: 'single_period'
            });
            wmsItem.load().then(function() {
                expect(wmsItem.findInfoSection('Metadata Links').content).toBe('http://examplemetadata1.com<br>http://examplemetadata2.com');
            }).then(done).otherwise(fail);
        });
    });

    it('derives getCapabilitiesUrl from url if getCapabilitiesUrl is not explicitly provided', function() {
        wmsItem.url = 'http://foo.com/bar';
        expect(wmsItem.getCapabilitiesUrl.indexOf(wmsItem.url)).toBe(0);
    });

    it('uses explicitly-provided getCapabilitiesUrl', function() {
        wmsItem.getCapabilitiesUrl = 'http://foo.com/metadata';
        wmsItem.url = 'http://foo.com/somethingElse';
        expect(wmsItem.getCapabilitiesUrl).toBe('http://foo.com/metadata');
    });

    it('defaults to having no dataUrl', function() {
        wmsItem.url = 'http://foo.bar';
        expect(wmsItem.dataUrl).toBeUndefined();
        expect(wmsItem.dataUrlType).toBeUndefined();
    });

    it('uses explicitly-provided dataUrl and dataUrlType', function() {
        wmsItem.dataUrl = 'http://foo.com/data';
        wmsItem.dataUrlType = 'wfs-complete';
        wmsItem.url = 'http://foo.com/somethingElse';
        expect(wmsItem.dataUrl).toBe('http://foo.com/data');
        expect(wmsItem.dataUrlType).toBe('wfs-complete');
    });

    it('can update from json', function() {
        wmsItem.updateFromJson({
            name: 'Name',
            description: 'Description',
            rectangle: [-10, 10, -20, 20],
            legendUrl: 'http://legend.com',
            dataUrlType: 'wfs',
            dataUrl: 'http://my.wfs.com/wfs',
            dataCustodian: 'Data Custodian',
            getCapabilitiesUrl: 'http://my.metadata.com',
            url: 'http://my.wms.com',
            layers: 'mylayer',
            parameters: {
                custom: true,
                awesome: 'maybe'
            },
            tilingScheme: new WebMercatorTilingScheme(),
            getFeatureInfoFormats: []
        });

        expect(wmsItem.name).toBe('Name');
        expect(wmsItem.description).toBe('Description');
        expect(wmsItem.rectangle).toEqual(Rectangle.fromDegrees(-10, 10, -20, 20));
        expect(wmsItem.legendUrl).toEqual(new LegendUrl('http://legend.com'));
        expect(wmsItem.dataUrlType).toBe('wfs');
        expect(wmsItem.dataUrl.indexOf('http://my.wfs.com/wfs')).toBe(0);
        expect(wmsItem.dataCustodian).toBe('Data Custodian');
        expect(wmsItem.getCapabilitiesUrl).toBe('http://my.metadata.com');
        expect(wmsItem.url).toBe('http://my.wms.com');
        expect(wmsItem.layers).toBe('mylayer');
        expect(wmsItem.parameters).toEqual({
            custom: true,
            awesome: 'maybe'
        });
        expect(wmsItem.tilingScheme instanceof WebMercatorTilingScheme).toBe(true);
        expect(wmsItem.getFeatureInfoFormats).toEqual([]);
    });

    it('uses reasonable defaults for updateFromJson', function() {
        wmsItem.updateFromJson({});

        expect(wmsItem.name).toBe('Unnamed Item');
        expect(wmsItem.description).toBe('');
        expect(wmsItem.rectangle).toBeUndefined();
        expect(wmsItem.legendUrl).toBeUndefined();
        expect(wmsItem.dataUrlType).toBeUndefined();
        expect(wmsItem.dataUrl).toBeUndefined();
        expect(wmsItem.dataCustodian).toBeUndefined();
        expect(wmsItem.metadataUrl).toBeUndefined();
        expect(wmsItem.url).toBeUndefined();
        expect(wmsItem.layers).toBe('');
        expect(wmsItem.parameters).toEqual({});
        expect(wmsItem.tilingScheme).toBeUndefined();
        expect(wmsItem.getFeatureInfoFormats).toBeUndefined();
    });

    it('requests styles property', function() {
        // Spy on the request to create an image, so that we can see what URL is requested.
        // Unfortunately this is implementation-dependent.
        spyOn(ImageryProvider, 'loadImage');
        wmsItem.updateFromJson({
            dataUrlType: 'wfs',
            url: 'http://my.wms.com',
            layers: 'mylayer',
            tilingScheme: new WebMercatorTilingScheme(),
            getFeatureInfoFormats: [],
            parameters: {
                styles: 'foobar'
            }
        });
        var imageryLayer = wmsItem.createImageryProvider();
        imageryLayer.requestImage(0, 0, 2);
        var requestedUrl = ImageryProvider.loadImage.calls.argsFor(0)[0].url;
        expect(requestedUrl.toLowerCase()).toContain('styles=foobar');
    });

    it('requests styles property even if uppercase', function() {
        // Spy on the request to create an image, so that we can see what URL is requested.
        // Unfortunately this is implementation-dependent.
        spyOn(ImageryProvider, 'loadImage');
        wmsItem.updateFromJson({
            dataUrlType: 'wfs',
            url: 'http://my.wms.com',
            layers: 'mylayer',
            tilingScheme: new WebMercatorTilingScheme(),
            getFeatureInfoFormats: [],
            parameters: {
                STYLES: 'foobar'
            }
        });
        var imageryLayer = wmsItem.createImageryProvider();
        imageryLayer.requestImage(0, 0, 2);
        var requestedUrl = ImageryProvider.loadImage.calls.argsFor(0)[0].url;
        expect(requestedUrl.toLowerCase()).toContain('styles=foobar');
    });

    it('can be round-tripped with serializeToJson and updateFromJson', function() {
        wmsItem.name = 'Name';
        wmsItem.id = 'Id';
        wmsItem.description = 'Description';
        wmsItem.rectangle = Rectangle.fromDegrees(-10, 10, -20, 20);
        wmsItem.legendUrl = new LegendUrl('http://legend.com', 'image/png');
        wmsItem.dataUrlType = 'wfs';
        wmsItem.dataUrl = 'http://my.wfs.com/wfs';
        wmsItem.dataCustodian = 'Data Custodian';
        wmsItem.metadataUrl = 'http://my.metadata.com';
        wmsItem.url = 'http://my.wms.com';
        wmsItem.layers = 'mylayer';
        wmsItem.parameters = {
            custom: true,
            awesome: 'maybe'
        };
        wmsItem.getFeatureInfoFormats = [];

        var json = wmsItem.serializeToJson();

        var reconstructed = new WebMapServiceCatalogItem(terria);
        reconstructed.updateFromJson(json);

        // We'll check for these later in toEqual but this makes it a bit easier to see what's different.
        expect(reconstructed.name).toBe(wmsItem.name);
        expect(reconstructed.description).toBe(wmsItem.description);
        expect(reconstructed.rectangle).toEqual(wmsItem.rectangle);
        expect(reconstructed.legendUrl).toEqual(wmsItem.legendUrl);
        expect(reconstructed.legendUrls).toEqual(wmsItem.legendUrls);
        expect(reconstructed.dataUrlType).toBe(wmsItem.dataUrlType);
        expect(reconstructed.dataUrl).toBe(wmsItem.dataUrl);
        expect(reconstructed.dataCustodian).toBe(wmsItem.dataCustodian);
        expect(reconstructed.metadataUrl).toBe(wmsItem.metadataUrl);
        expect(reconstructed.url).toBe(wmsItem.url);
        expect(reconstructed.layers).toBe(wmsItem.layers);
        expect(reconstructed.parameters).toBe(wmsItem.parameters);
        expect(reconstructed.getFeatureInfoFormats).toEqual(wmsItem.getFeatureInfoFormats);
    });

    it('can get handle plain text in textAttribution', function() {
        wmsItem.updateFromJson({
            attribution: "Plain text"
        });
        expect(wmsItem.attribution).toEqual(new Credit("Plain text", undefined, undefined));
    });
    it('can get handle object in textAttribution', function() {
        var test = {
            text: "test",
            link: "link"
        };
        wmsItem.updateFromJson({
            attribution: test
        });
        expect(wmsItem.attribution.text).toEqual("test");
        expect(wmsItem.attribution.link).toEqual("link");
    });

    it('can understand comma-separated datetimes', function(done) {
        // <Dimension name="time" units="ISO8601" multipleValues="true" current="true" default="2014-01-01T00:00:00.000Z">
        // 2002-01-01T00:00:00.000Z,2003-01-01T00:00:00.000Z,2004-01-01T00:00:00.000Z,
        // 2005-01-01T00:00:00.000Z,2006-01-01T00:00:00.000Z,2007-01-01T00:00:00.000Z,
        // 2008-01-01T00:00:00.000Z,2009-01-01T00:00:00.000Z,2010-01-01T00:00:00.000Z,
        // 2011-01-01T00:00:00.000Z,2012-01-01T00:00:00.000Z,2013-01-01T00:00:00.000Z,
        // 2014-01-01T00:00:00.000Z
        // </Dimension>
        wmsItem.updateFromJson({
            url: 'http://example.com',
            metadataUrl: 'test/WMS/comma_sep_datetimes.xml',
            layers: '13_intervals'
        });
        wmsItem.load().then(function() {
            expect(wmsItem.intervals.length).toEqual(13);
            done();
        }).otherwise(function() {
            fail();
            done();
        });
    });


    it('can understand two-part period datetimes', function(done) {
        // <Dimension name="time" units="ISO8601" />
        //   <Extent name="time">2015-04-27T16:15:00/2015-04-27T18:45:00</Extent>
        wmsItem.updateFromJson({
            url: 'http://example.com',
            metadataUrl: 'test/WMS/single_period_datetimes.xml',
            layers: 'single_period'
        });
        wmsItem.load().then(function() {
            expect(wmsItem.intervals.length).toEqual(1);
            done();
        }).otherwise(function(e) {
            fail(e);
            done();
        });

    });

    it('can understand three-part period datetimes', function(done) {
        // <Dimension name="time" units="ISO8601" />
        //   <Extent name="time">2015-04-27T16:15:00/2015-04-27T18:45:00/PT15M</Extent>
        wmsItem.updateFromJson({
            url: 'http://example.com',
            metadataUrl: 'test/WMS/period_datetimes.xml',
            layers: 'single_period'
        });
        wmsItem.load().then(function() {
            expect(wmsItem.intervals.length).toEqual(11);
            done();
        }).otherwise(function(e) {
            fail(e);
            done();
        });
    });

    it('warns on bad periodicity in datetimes', function(done) {
        // <Dimension name="time" units="ISO8601" />
        //   <Extent name="time">2015-04-27T16:15:00/2015-04-27T18:45:00/PBAD</Extent>
        wmsItem.updateFromJson({
            url: 'http://example.com',
            metadataUrl: 'test/WMS/bad_datetime.xml',
            layers: 'single_period'
        });
        var remover = wmsItem.terria.error.addEventListener(function() {
            expect(true).toBe(true);
            remover();
            done();
        });
        wmsItem.load();
    });

    it('discards invalid layer names as long as at least one layer name is valid', function(done) {
        wmsItem.updateFromJson({
            url: 'http://example.com',
            metadataUrl: 'test/WMS/single_style_legend_url.xml',
            layers: 'foo,single_period'
        });
        wmsItem.load().then(function() {
            expect(wmsItem.layers).toBe('single_period');
        }).then(done).otherwise(done.fail);
    });

    it('fails to load if all layer names are invalid', function(done) {
        wmsItem.updateFromJson({
            url: 'http://example.com',
            metadataUrl: 'test/WMS/single_style_legend_url.xml',
            layers: 'foo,bar'
        });
        wmsItem.load().then(done.fail).otherwise(done);
    });
});
