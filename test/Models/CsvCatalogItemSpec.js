'use strict';

/*global require,describe,it,expect,beforeEach*/

var Terria = require('../../lib/Models/Terria');
var CatalogItem = require('../../lib/Models/CatalogItem');
var CsvCatalogItem = require('../../lib/Models/CsvCatalogItem');

var Color = require('terriajs-cesium/Source/Core/Color');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var VarType = require('../../lib/Map/VarType');


var terria;
var csvItem;

beforeEach(function() {
    terria = new Terria({
        baseUrl: './',
        regionMappingDefinitionsUrl: 'test/csv/regionMapping.json',

    });
    csvItem = new CsvCatalogItem(terria);
});

function except(e, done) { 
  return e.message || e.response || JSON.stringify(e); 
}


describe('CsvCatalogItem', function() {
    it('has sensible type and typeName', function() {
        expect(csvItem.type).toBe('csv');
        expect(csvItem.typeName).toBe('Comma-Separated Values (CSV)');
    });

    it('throws if constructed without a Terria instance', function() {
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
        expect(csvItem.rectangle).toBeUndefined();
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

        var reconstructed = new CsvCatalogItem(terria);
        reconstructed.updateFromJson(json);

        expect(reconstructed).toEqual(csvItem);
    });

    it('is correctly loading csv data from a file', function(done) {
        csvItem.url = 'test/csv/minimal.csv';
        return csvItem.load().then(function() {
            expect(csvItem._tableDataSource).toBeDefined();
            expect(csvItem._tableDataSource.dataset).toBeDefined();
            expect(csvItem._tableDataSource.dataset.getRowCount()).toEqual(2);
            done();
        });
    });
/*
    it('is correctly loading csv data from text', function() {
        expect(csvItem instanceof CatalogItem).toBe(true);
    });
*/

    it('throws an error on non-csv file', function(done) {
        csvItem.url = 'test/GeoJSON/polygon.topojson';
        return csvItem.load().yield(false)
            .otherwise(function(){ return true; })
            .then(function(x) {
                expect(x).toBe(true);
                done();
            });
    });


    it('identifies "lat" and "lon" fields"', function(done) {
        csvItem.updateFromJson( { data: 'lat,lon,value\n-37,145,10' });
        csvItem.load().then(function() {
            expect(csvItem._tableDataSource.dataset.hasLocationData()).toBe(true);
            done();
        });
    });
    it('identifies "latitude" and "longitude" fields"', function(done) {
        csvItem.updateFromJson( { data: 'latitude,longitude,value\n-37,145,10' });
        csvItem.load().then(function() {
            expect(csvItem._tableDataSource.dataset.hasLocationData()).toBe(true);
            done();
        });
    });
    it('does not mistakenly identify "latvian" and "lone_person" fields"', function(done) {
        csvItem.updateFromJson( { data: 'latvian,lone_person,lat,lon,value\n-37,145,-37,145,10' });
        csvItem.load().then(function() {
            expect(csvItem._tableDataSource.dataset.getVariableNamesByType(VarType.LON)).toEqual(['lon']);
            expect(csvItem._tableDataSource.dataset.getVariableNamesByType(VarType.LAT)).toEqual(['lat']);
            return true;
        }).otherwise(except).then(function(x) { 
            expect(x).toBe(true);
            done();
        });
    });



    it('matches LGAs by code"', function(done) {
        csvItem.updateFromJson( { data: 'lga_code,value\n31000,1' });
        csvItem.load().then(function() {
            expect(csvItem._regionMapped).toBe(true);
            expect(csvItem.colorFunc).toBeDefined();
            // 242 is the shapefile index of LGA boundary 31000. What a crappy way to test...
            expect(csvItem.colorFunc(242)).not.toEqual([0,0,0,0]);
            return true;
        }).otherwise(except).then(function(x){
            expect(x).toBe(true);
            done();
        });

    });
    it('matches LGAs by names in various formats"', function(done) {
        csvItem.updateFromJson( { data: 'lga_name,value\nCity of Melbourne,1\nGreater Geelong,2\nSydney (S),3' });
        csvItem.load().then(function() {
            expect(csvItem._regionMapped).toBe(true);
            expect(csvItem.colorFunc).toBeDefined();
            expect(csvItem.colorFunc(121)).not.toEqual([0,0,0,0]);
            expect(csvItem.colorFunc(180)).not.toEqual([0,0,0,0]);
            expect(csvItem.colorFunc(197)).not.toEqual([0,0,0,0]);
            return true;
        }).otherwise(except).then(function(x){
            expect(x).toBe(true);
            done();
        });

    });

    var greenTableStyle = {
        "colorMap": [ 
        {
            "offset": 0,
            "color": "rgba(0, 64, 0, 1.00)"
        }, {
            "offset": 1,
            "color": "rgba(0, 255, 0, 1.00)"
        } ]
    };
    it('respects tableStyle color ramping for regions"', function(done) {
        csvItem.updateFromJson( { 
            data: 'lga_name,value\nCity of Melbourne,0\nGreater Geelong,5\nSydney (S),10',
            tableStyle: greenTableStyle });
        csvItem.load().then(function() {
            expect(csvItem._regionMapped).toBe(true);
            expect(csvItem.colorFunc).toBeDefined();
            // let's not require a linear mapping
            expect(csvItem.colorFunc(121)).toEqual([0,255,0,255]);
            expect(csvItem.colorFunc(180)[1]).toBeGreaterThan(64);
            expect(csvItem.colorFunc(180)[1]).toBeLessThan(255);
            expect(csvItem.colorFunc(197)).toEqual([0,64,0,255]);
            return true;
        }).otherwise(except).then(function(x){
            expect(x).toBe(true);
            done();
        });

    });

    it('handles enum fields for regions', function(done) {
        csvItem.url = 'test/csv/postcode_enum.csv';

        csvItem.load().then(function() {
            expect(csvItem._regionMapped).toBe(true);
            expect(csvItem.tableStyle.dataVariable).toBe('enum');
        }).yield(true).otherwise(except).then(function(x) {
            expect(x).toBe(true);
            done();
        });
    });
    it('handles enum fields for lat-longs', function(done) {
        csvItem.url = 'test/csv/lat_lon_enum.csv';

        csvItem.load().then(function() {
            expect(csvItem.tableStyle.dataVariable).toBe('enum');
        }).yield(true).otherwise(except).then(function(x) {
            expect(x).toBe(true);
            done();
        });
    });

    /* 
    to test: 
    - lat lon with enum
    - lat lon with scalar
    - lat lon with no values
    - region with scalar
    - region with enum
    - region with no values
    */




    /*
    it('returns an error on non-csv text', function() {
        expect(csvItem instanceof CatalogItem).toBe(true);
    });

    it('is using style data from viewModel', function() {
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
*/
    it('has a blank in the description table for a missing number', function(done) {
        csvItem.url = 'test/missingNumberFormatting.csv';
        return csvItem.load().then(function() {
            var entities = csvItem._tableDataSource.entities.values;
            expect(entities.length).toBe(2);
            expect(entities[0].description.getValue()).toContain('<td>Vals</td><td align="right">10</td>');
            expect(entities[1].description.getValue()).toContain('<td>Vals</td><td align="right"></td>');
            done();
        });
    });

    it('renders a point with no value in transparent black', function(done) {
        csvItem.url = 'test/missingNumberFormatting.csv';
        return csvItem.load().then(function() {
            var entities = csvItem._tableDataSource.entities.values;
            expect(entities.length).toBe(2);
            expect(entities[0].point.color.getValue()).not.toEqual(new Color(0.0, 0.0, 0.0, 0.0));
            expect(entities[1].point.color.getValue()).toEqual(new Color(0.0, 0.0, 0.0, 0.0));
            done();
        });
    });
});
