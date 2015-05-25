'use strict';

/*global require,describe,it,expect,beforeEach*/

var Terria = require('../../lib/Models/Terria');
var ImageryLayerCatalogItem = require('../../lib/Models/ImageryLayerCatalogItem');
var WebMapServiceCatalogItem = require('../../lib/Models/WebMapServiceCatalogItem');
var WebMercatorTilingScheme = require('terriajs-cesium/Source/Core/WebMercatorTilingScheme');

var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');

var terria;
var wmsItem;

beforeEach(function() {
    terria = new Terria({
        baseUrl: './'
    });
    wmsItem = new WebMapServiceCatalogItem(terria);
});

describe('WebMapServiceCatalogItemViewModel', function() {
    it('has sensible type and typeName', function() {
        expect(wmsItem.type).toBe('wms');
        expect(wmsItem.typeName).toBe('Web Map Service (WMS)');
    });

    it('throws if constructed without a Terria instance', function() {
        expect(function() {
            var viewModel = new WebMapServiceCatalogItem(); // jshint ignore:line
        }).toThrow();
    });

    it('can be constructed', function() {
        expect(wmsItem).toBeDefined();
    });

    it('is derived from ImageryLayerDataItemViewModel', function() {
        expect(wmsItem instanceof ImageryLayerCatalogItem).toBe(true);
    });

    it('derives legendUrl from url if legendUrl is not explicitly provided', function() {
        wmsItem.url = 'http://foo.com/bar';
        expect(wmsItem.legendUrl.indexOf(wmsItem.url)).toBe(0);
    });

    it('uses explicitly-provided legendUrl', function() {
        wmsItem.legendUrl = 'http://foo.com/legend.png';
        wmsItem.url = 'http://foo.com/somethingElse';
        expect(wmsItem.legendUrl).toBe('http://foo.com/legend.png');
    });

    it('derives metadataUrl from url if metadataUrl is not explicitly provided', function() {
        wmsItem.url = 'http://foo.com/bar';
        expect(wmsItem.metadataUrl.indexOf(wmsItem.url)).toBe(0);
    });

    it('uses explicitly-provided metadataUrl', function() {
        wmsItem.metadataUrl = 'http://foo.com/metadata';
        wmsItem.url = 'http://foo.com/somethingElse';
        expect(wmsItem.metadataUrl).toBe('http://foo.com/metadata');
    });

    it('derives dataUrl from url if dataUrl and assumes type is "wfs" if dataUrl is not explicitly provided', function() {
        wmsItem.url = 'http://foo.com/bar';
        expect(wmsItem.dataUrl.indexOf(wmsItem.url)).toBe(0);
        expect(wmsItem.dataUrlType).toBe('wfs');
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
            metadataUrl: 'http://my.metadata.com',
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
        expect(wmsItem.legendUrl).toBe('http://legend.com');
        expect(wmsItem.dataUrlType).toBe('wfs');
        expect(wmsItem.dataUrl.indexOf('http://my.wfs.com/wfs')).toBe(0);
        expect(wmsItem.dataCustodian).toBe('Data Custodian');
        expect(wmsItem.metadataUrl).toBe('http://my.metadata.com');
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
        expect(wmsItem.rectangle).toEqual(Rectangle.MAX_VALUE);
        expect(wmsItem.legendUrl.indexOf('?')).toBe(0);
        expect(wmsItem.dataUrlType).toBe('wfs');
        expect(wmsItem.dataUrl.indexOf('?')).toBe(0);
        expect(wmsItem.dataCustodian).toBeUndefined();
        expect(wmsItem.metadataUrl.indexOf('?')).toBe(0);
        expect(wmsItem.url).toBe('');
        expect(wmsItem.layers).toBe('');
        expect(wmsItem.parameters).toBeUndefined();
        expect(wmsItem.tilingScheme).toBeUndefined();
        expect(wmsItem.getFeatureInfoFormats).toBeUndefined();
    });

    it('can be round-tripped with serializeToJson and updateFromJson', function() {
        wmsItem.name = 'Name';
        wmsItem.description = 'Description';
        wmsItem.rectangle = Rectangle.fromDegrees(-10, 10, -20, 20);
        wmsItem.legendUrl = 'http://legend.com';
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

        expect(reconstructed).toEqual(wmsItem);
    });
});
