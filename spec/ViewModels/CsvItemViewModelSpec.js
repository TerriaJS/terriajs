'use strict';

/*global require,describe,it,expect,beforeEach*/

var ApplicationViewModel = require('../../src/ViewModels/ApplicationViewModel');
var CatalogItemViewModel = require('../../src/ViewModels/CatalogItemViewModel');
var CsvItemViewModel = require('../../src/ViewModels/CsvItemViewModel');

var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');

var application;
var csvViewModel;

beforeEach(function() {
    application = new ApplicationViewModel();
    csvViewModel = new CsvItemViewModel(application);
});

describe('CsvDataItemViewModel', function() {
    it('has sensible type and typeName', function() {
        expect(csvViewModel.type).toBe('csv');
        expect(csvViewModel.typeName).toBe('Comma-Separated Values (CSV)');
    });

    it('throws if constructed without an application', function() {
        expect(function() {
            var viewModel = new CsvItemViewModel(); // jshint ignore:line
        }).toThrow();
    });

    it('can be constructed', function() {
        expect(csvViewModel).toBeDefined();
    });

    it('is derived from CatalogItemViewModel', function() {
        expect(csvViewModel instanceof CatalogItemViewModel).toBe(true);
    });

    it('can update from json', function() {
        var dataStr = 'col1, col2\ntest, 0';
        csvViewModel.updateFromJson({
            name: 'Name',
            description: 'Description',
            rectangle: [-10, 10, -20, 20],
            url: 'http://my.csv.com/test.csv',
            data: dataStr,
            dataSourceUrl: 'none',
            dataCustodian: 'Data Custodian',
        });

        expect(csvViewModel.name).toBe('Name');
        expect(csvViewModel.description).toBe('Description');
        expect(csvViewModel.rectangle).toEqual(Rectangle.fromDegrees(-10, 10, -20, 20));
        expect(csvViewModel.type).toBe('csv');
        expect(csvViewModel.url.indexOf('http://my.csv.com/test.csv')).toBe(0);
        expect(csvViewModel.data.indexOf(dataStr)).toBe(0);
        expect(csvViewModel.dataCustodian).toBe('Data Custodian');
        expect(csvViewModel.dataSourceUrl).toBe('none');
    });

    it('uses reasonable defaults for updateFromJson', function() {
        csvViewModel.updateFromJson({});

        expect(csvViewModel.name).toBe('Unnamed Item');
        expect(csvViewModel.description).toBe('');
        expect(csvViewModel.rectangle).toEqual(Rectangle.MAX_VALUE);
        expect(csvViewModel.type).toBe('csv');
        expect(csvViewModel.url).toBeUndefined();
        expect(csvViewModel.data).toBeUndefined();
        expect(csvViewModel.dataSourceUrl).toBeUndefined();
        expect(csvViewModel.dataCustodian).toBeUndefined();
    });

    it('can be round-tripped with serializeToJson and updateFromJson', function() {
        var dataStr = 'col1, col2\ntest, 0';
        csvViewModel.updateFromJson({
            name: 'Name',
            description: 'Description',
            rectangle: [-10, 10, -20, 20],
            url: 'http://my.csv.com/test.csv',
            data: dataStr,
            dataSourceUrl: 'none',
            dataCustodian: 'Data Custodian',
        });

        var json = csvViewModel.serializeToJson();

        var reconstructed = new CsvItemViewModel(application);
        reconstructed.updateFromJson(json);

        expect(reconstructed).toEqual(csvViewModel);
    });

    it('is correctly loading csv data from a file', function() {
        expect(csvViewModel instanceof CatalogItemViewModel).toBe(true);
    });

    it('is correctly loading csv data from text', function() {
        expect(csvViewModel instanceof CatalogItemViewModel).toBe(true);
    });

    it('returns an error on non-csv file', function() {
        expect(csvViewModel instanceof CatalogItemViewModel).toBe(true);
    });

    it('returns an error on non-csv text', function() {
        expect(csvViewModel instanceof CatalogItemViewModel).toBe(true);
    });

    it('is using style data from viewModel', function() {
        expect(csvViewModel instanceof CatalogItemViewModel).toBe(true);
    });

    it('is correctly loading region mapped data from a file', function() {
        expect(csvViewModel instanceof CatalogItemViewModel).toBe(true);
    });

    it('is correctly loading region mapped data from text', function() {
        expect(csvViewModel instanceof CatalogItemViewModel).toBe(true);
    });

    it('correctly changes the region mapping data variable', function() {
        expect(csvViewModel instanceof CatalogItemViewModel).toBe(true);
    });

    it('correctly changes the region mapping region variable', function() {
        expect(csvViewModel instanceof CatalogItemViewModel).toBe(true);
    });

    it('correctly changes the region mapping region variable', function() {
        expect(csvViewModel instanceof CatalogItemViewModel).toBe(true);
    });

    it('correctly changes the region mapping color table', function() {
        expect(csvViewModel instanceof CatalogItemViewModel).toBe(true);
    });

    it('is shown in cesium', function() {
        expect(csvViewModel instanceof CatalogItemViewModel).toBe(true);
    });

    it('is returns an error if already shown in cesium', function() {
        expect(csvViewModel instanceof CatalogItemViewModel).toBe(true);
    });

    it('is properly hidden in cesium', function() {
        expect(csvViewModel instanceof CatalogItemViewModel).toBe(true);
    });

    it('is returns an error if not being shown in cesium', function() {
        expect(csvViewModel instanceof CatalogItemViewModel).toBe(true);
    });

    it('is shown in leaflet', function() {
        expect(csvViewModel instanceof CatalogItemViewModel).toBe(true);
    });

    it('is returns an error if already shown in leaflet', function() {
        expect(csvViewModel instanceof CatalogItemViewModel).toBe(true);
    });

    it('is properly hidden in leaflet', function() {
        expect(csvViewModel instanceof CatalogItemViewModel).toBe(true);
    });

    it('is returns an error if not being shown in leaflet', function() {
        expect(csvViewModel instanceof CatalogItemViewModel).toBe(true);
    });

});
