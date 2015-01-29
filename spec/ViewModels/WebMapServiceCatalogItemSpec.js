'use strict';

/*global require,describe,it,expect,beforeEach*/

var Application = require('../../src/Models/Application');
var ImageryLayerCatalogItem = require('../../src/Models/ImageryLayerCatalogItem');
var WebMapServiceCatalogItem = require('../../src/Models/WebMapServiceCatalogItem');
var WebMercatorTilingScheme = require('../../third_party/cesium/Source/Core/WebMercatorTilingScheme');

var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');

var application;
var wmsViewModel;

beforeEach(function() {
    application = new Application();
    wmsViewModel = new WebMapServiceCatalogItem(application);
});

describe('WebMapServiceDataItemViewModel', function() {
    it('has sensible type and typeName', function() {
        expect(wmsViewModel.type).toBe('wms');
        expect(wmsViewModel.typeName).toBe('Web Map Service (WMS)');
    });

    it('throws if constructed without an application', function() {
        expect(function() {
            var viewModel = new WebMapServiceCatalogItem(); // jshint ignore:line
        }).toThrow();
    });

    it('can be constructed', function() {
        expect(wmsViewModel).toBeDefined();
    });

    it('is derived from ImageryLayerDataItemViewModel', function() {
        expect(wmsViewModel instanceof ImageryLayerCatalogItem).toBe(true);
    });

    it('derives legendUrl from url if legendUrl is not explicitly provided', function() {
        wmsViewModel.url = 'http://foo.com/bar';
        expect(wmsViewModel.legendUrl.indexOf(wmsViewModel.url)).toBe(0);
    });

    it('uses explicitly-provided legendUrl', function() {
        wmsViewModel.legendUrl = 'http://foo.com/legend.png';
        wmsViewModel.url = 'http://foo.com/somethingElse';
        expect(wmsViewModel.legendUrl).toBe('http://foo.com/legend.png');
    });

    it('derives metadataUrl from url if metadataUrl is not explicitly provided', function() {
        wmsViewModel.url = 'http://foo.com/bar';
        expect(wmsViewModel.metadataUrl.indexOf(wmsViewModel.url)).toBe(0);
    });

    it('uses explicitly-provided metadataUrl', function() {
        wmsViewModel.metadataUrl = 'http://foo.com/metadata';
        wmsViewModel.url = 'http://foo.com/somethingElse';
        expect(wmsViewModel.metadataUrl).toBe('http://foo.com/metadata');
    });

    it('derives dataUrl from url if dataUrl and assumes type is "wfs" if dataUrl is not explicitly provided', function() {
        wmsViewModel.url = 'http://foo.com/bar';
        expect(wmsViewModel.dataUrl.indexOf(wmsViewModel.url)).toBe(0);
        expect(wmsViewModel.dataUrlType).toBe('wfs');
    });

    it('uses explicitly-provided dataUrl and dataUrlType', function() {
        wmsViewModel.dataUrl = 'http://foo.com/data';
        wmsViewModel.dataUrlType = 'wfs-complete';
        wmsViewModel.url = 'http://foo.com/somethingElse';
        expect(wmsViewModel.dataUrl).toBe('http://foo.com/data');
        expect(wmsViewModel.dataUrlType).toBe('wfs-complete');
    });

    it('can update from json', function() {
        wmsViewModel.updateFromJson({
            name: 'Name',
            description: 'Description',
            rectangle: [-10, 10, -20, 20],
            legendUrl: 'http://legend.com',
            dataUrlType: 'wfs',
            dataUrl: 'http://my.wfs.com/wfs',
            dataCustodian: 'Data Custodian',
            metadataUrl: 'http://my.metadata.com',
            url: 'http://my.wms.com',
            layers: 'mylayer',
            parameters: {
                custom: true,
                awesome: 'maybe'
            },
            tilingScheme: new WebMercatorTilingScheme(),
            getFeatureInfoAsGeoJson: false,
            getFeatureInfoAsXml: false
        });

        expect(wmsViewModel.name).toBe('Name');
        expect(wmsViewModel.description).toBe('Description');
        expect(wmsViewModel.rectangle).toEqual(Rectangle.fromDegrees(-10, 10, -20, 20));
        expect(wmsViewModel.legendUrl).toBe('http://legend.com');
        expect(wmsViewModel.dataUrlType).toBe('wfs');
        expect(wmsViewModel.dataUrl.indexOf('http://my.wfs.com/wfs')).toBe(0);
        expect(wmsViewModel.dataCustodian).toBe('Data Custodian');
        expect(wmsViewModel.metadataUrl).toBe('http://my.metadata.com');
        expect(wmsViewModel.url).toBe('http://my.wms.com');
        expect(wmsViewModel.layers).toBe('mylayer');
        expect(wmsViewModel.parameters).toEqual({
            custom: true,
            awesome: 'maybe'
        });
        expect(wmsViewModel.tilingScheme instanceof WebMercatorTilingScheme).toBe(true);
        expect(wmsViewModel.getFeatureInfoAsGeoJson).toBe(false);
        expect(wmsViewModel.getFeatureInfoAsXml).toBe(false);
    });

    it('uses reasonable defaults for updateFromJson', function() {
        wmsViewModel.updateFromJson({});

        expect(wmsViewModel.name).toBe('Unnamed Item');
        expect(wmsViewModel.description).toBe('');
        expect(wmsViewModel.rectangle).toEqual(Rectangle.MAX_VALUE);
        expect(wmsViewModel.legendUrl.indexOf('?')).toBe(0);
        expect(wmsViewModel.dataUrlType).toBe('wfs');
        expect(wmsViewModel.dataUrl.indexOf('?')).toBe(0);
        expect(wmsViewModel.dataCustodian).toBeUndefined();
        expect(wmsViewModel.metadataUrl.indexOf('?')).toBe(0);
        expect(wmsViewModel.url).toBe('');
        expect(wmsViewModel.layers).toBe('');
        expect(wmsViewModel.parameters).toBeUndefined();
        expect(wmsViewModel.tilingScheme).toBeUndefined();
        expect(wmsViewModel.getFeatureInfoAsGeoJson).toBe(true);
        expect(wmsViewModel.getFeatureInfoAsXml).toBe(true);
    });

    it('can be round-tripped with serializeToJson and updateFromJson', function() {
        wmsViewModel.name = 'Name';
        wmsViewModel.description = 'Description';
        wmsViewModel.rectangle = Rectangle.fromDegrees(-10, 10, -20, 20);
        wmsViewModel.legendUrl = 'http://legend.com';
        wmsViewModel.dataUrlType = 'wfs';
        wmsViewModel.dataUrl = 'http://my.wfs.com/wfs';
        wmsViewModel.dataCustodian = 'Data Custodian';
        wmsViewModel.metadataUrl = 'http://my.metadata.com';
        wmsViewModel.url = 'http://my.wms.com';
        wmsViewModel.layers = 'mylayer';
        wmsViewModel.parameters = {
            custom: true,
            awesome: 'maybe'
        };
        wmsViewModel.getFeatureInfoAsGeoJson = false;
        wmsViewModel.getFeatureInfoAsXml = false;

        var json = wmsViewModel.serializeToJson();

        var reconstructed = new WebMapServiceCatalogItem(application);
        reconstructed.updateFromJson(json);

        expect(reconstructed).toEqual(wmsViewModel);
    });
});
