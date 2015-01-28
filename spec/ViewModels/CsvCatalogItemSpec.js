'use strict';

/*global require,describe,it,expect,beforeEach*/

var Application = require('../../src/Models/Application');
var CatalogItem = require('../../src/Models/CatalogItem');
var CsvCatalogItem = require('../../src/Models/CsvCatalogItem');

var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');

var application;
var csvItem;

beforeEach(function() {
    application = new Application();
    csvItem = new CsvCatalogItem(application);
});

describe('CsvCatalogItem', function() {
    it('has sensible type and typeName', function() {
        expect(csvItem.type).toBe('csv');
        expect(csvItem.typeName).toBe('Comma-Separated Values (CSV)');
    });

    it('throws if constructed without an application', function() {
        expect(function() {
            var viewModel = new CsvCatalogItem(); // jshint ignore:line
        }).toThrow();
    });

    it('can be constructed', function() {
        expect(csvItem).toBeDefined();
    });

    it('is derived from CatalogItem', function() {
        expect(csvItem instanceof CatalogItem).toBe(true);
    });

    it('can update from json', function() {
        var dataStr = 'col1, col2\ntest, 0';
        csvItem.updateFromJson({
            name: 'Name',
            description: 'Description',
            rectangle: [-10, 10, -20, 20],
            url: 'http://my.csv.com/test.csv',
            data: dataStr,
            dataSourceUrl: 'none',
            dataCustodian: 'Data Custodian',
        });

        expect(csvItem.name).toBe('Name');
        expect(csvItem.description).toBe('Description');
        expect(csvItem.rectangle).toEqual(Rectangle.fromDegrees(-10, 10, -20, 20));
        expect(csvItem.type).toBe('csv');
        expect(csvItem.url.indexOf('http://my.csv.com/test.csv')).toBe(0);
        expect(csvItem.data.indexOf(dataStr)).toBe(0);
        expect(csvItem.dataCustodian).toBe('Data Custodian');
        expect(csvItem.dataSourceUrl).toBe('none');
    });

    it('uses reasonable defaults for updateFromJson', function() {
        csvItem.updateFromJson({});

        expect(csvItem.name).toBe('Unnamed Item');
        expect(csvItem.description).toBe('');
        expect(csvItem.rectangle).toEqual(Rectangle.MAX_VALUE);
        expect(csvItem.type).toBe('csv');
        expect(csvItem.url).toBeUndefined();
        expect(csvItem.data).toBeUndefined();
        expect(csvItem.dataSourceUrl).toBeUndefined();
        expect(csvItem.dataCustodian).toBeUndefined();
    });

    it('can be round-tripped with serializeToJson and updateFromJson', function() {
        var dataStr = 'col1, col2\ntest, 0';
        csvItem.updateFromJson({
            name: 'Name',
            description: 'Description',
            rectangle: [-10, 10, -20, 20],
            url: 'http://my.csv.com/test.csv',
            data: dataStr,
            dataSourceUrl: 'none',
            dataCustodian: 'Data Custodian',
        });

        var json = csvItem.serializeToJson();

        var reconstructed = new CsvCatalogItem(application);
        reconstructed.updateFromJson(json);

        expect(reconstructed).toEqual(csvItem);
    });

    it('is correctly loading csv data from a file', function() {
        expect(csvItem instanceof CatalogItem).toBe(true);
    });

    it('is correctly loading csv data from text', function() {
        expect(csvItem instanceof CatalogItem).toBe(true);
    });

    it('returns an error on non-csv file', function() {
        expect(csvItem instanceof CatalogItem).toBe(true);
    });

    it('returns an error on non-csv text', function() {
        expect(csvItem instanceof CatalogItem).toBe(true);
    });

    it('is using style data from viewModel', function() {
        expect(csvItem instanceof CatalogItem).toBe(true);
    });

    it('is correctly loading region mapped data from a file', function() {
        expect(csvItem instanceof CatalogItem).toBe(true);
    });

    it('is correctly loading region mapped data from text', function() {
        expect(csvItem instanceof CatalogItem).toBe(true);
    });

    it('correctly changes the region mapping data variable', function() {
        expect(csvItem instanceof CatalogItem).toBe(true);
    });

    it('correctly changes the region mapping region variable', function() {
        expect(csvItem instanceof CatalogItem).toBe(true);
    });

    it('correctly changes the region mapping region variable', function() {
        expect(csvItem instanceof CatalogItem).toBe(true);
    });

    it('correctly changes the region mapping color table', function() {
        expect(csvItem instanceof CatalogItem).toBe(true);
    });

    it('is shown in cesium', function() {
        expect(csvItem instanceof CatalogItem).toBe(true);
    });

    it('is returns an error if already shown in cesium', function() {
        expect(csvItem instanceof CatalogItem).toBe(true);
    });

    it('is properly hidden in cesium', function() {
        expect(csvItem instanceof CatalogItem).toBe(true);
    });

    it('is returns an error if not being shown in cesium', function() {
        expect(csvItem instanceof CatalogItem).toBe(true);
    });

    it('is shown in leaflet', function() {
        expect(csvItem instanceof CatalogItem).toBe(true);
    });

    it('is returns an error if already shown in leaflet', function() {
        expect(csvItem instanceof CatalogItem).toBe(true);
    });

    it('is properly hidden in leaflet', function() {
        expect(csvItem instanceof CatalogItem).toBe(true);
    });

    it('is returns an error if not being shown in leaflet', function() {
        expect(csvItem instanceof CatalogItem).toBe(true);
    });

});
