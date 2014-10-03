'use strict';

/*global require,describe,it,expect*/

var GeoDataCatalogContext = require('../../src/ViewModels/GeoDataCatalogContext');
var ImageryLayerDataSourceViewModel = require('../../src/ViewModels/ImageryLayerDataSourceViewModel');
var WebMapServiceDataSourceViewModel = require('../../src/ViewModels/WebMapServiceDataSourceViewModel');

var context;
var wmsViewModel;

beforeEach(function() {
    context = new GeoDataCatalogContext();
    wmsViewModel = new WebMapServiceDataSourceViewModel(context);
});

describe('WebMapServiceDataSourceViewModel', function() {
    it('has sensible type and typeName', function() {
        expect(wmsViewModel.type).toBe('wms');
        expect(wmsViewModel.typeName).toBe('Web Map Service (WMS)');
    });

    it('throws if constructed without a context', function() {
        expect(function() {
            var viewModel = new WebMapServiceDataSourceViewModel();
        }).toThrow();
    });

    it('can be constructed', function() {
        expect(wmsViewModel).toBeDefined();
    });

    it('is derived from ImageryLayerDataSourceViewModel', function() {
        expect(wmsViewModel instanceof ImageryLayerDataSourceViewModel).toBe(true);
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
});
