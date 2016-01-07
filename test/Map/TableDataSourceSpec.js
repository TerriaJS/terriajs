'use strict';

/*global require*/
var loadText = require('terriajs-cesium/Source/Core/loadText');
var TableDataSource = require('../../lib/Map/TableDataSource');
var TableStyle = require('../../lib/Map/TableStyle');

var tableDataSource;

beforeEach(function() {
    tableDataSource = new TableDataSource();
});

describe('TableDataSource', function() {

    it('can be constructed', function() {
        expect(tableDataSource).toBeDefined();
    });

    it('can load csv and detect lat and lon', function(done) {
        loadText('/test/csv/lat_lon_val.csv').then(function(text) {
            tableDataSource.load(text);
            expect(tableDataSource.hasLatitudeAndLongitude).toEqual(true);
        }).then(done).otherwise(done.fail);
    });

    it('sets the default dataVariable ignoring lat and lon', function(done) {
        loadText('/test/csv/lat_lon_val.csv').then(function(text) {
            tableDataSource.load(text);
            expect(tableDataSource._tableStructure.activeItems.length).toEqual(1);
            expect(tableDataSource._tableStructure.activeItems[0].name).toEqual('value');
        }).then(done).otherwise(done.fail);
    });

    it('does not set the clock when there is no date column', function(done) {
        loadText('/test/csv/lat_lon_val.csv').then(function(text) {
            tableDataSource.load(text);
            expect(tableDataSource.clock).toBeUndefined();
        }).then(done).otherwise(done.fail);
    });

    it('sets the clock when there is a date column', function(done) {
        loadText('/test/csv/lat_long_enum_moving_date.csv').then(function(text) {
            tableDataSource.load(text);
            expect(tableDataSource.clock).toBeDefined();
        }).then(done).otherwise(done.fail);
    });

    it('scales points', function(done) {
        var tableStyle = new TableStyle({
            dataVariable: 'val',
            scaleByValue: true,
            scale: 5
        });
        loadText('/test/csv/lat_lon_enum_val.csv').then(function(text) {
            tableDataSource.load(text, tableStyle);
            var features = tableDataSource.entities.values;
            expect(tableDataSource._tableStructure.columns[0].values).not.toEqual(tableDataSource._tableStructure.columns[1].values);
            // expect the first two features to have different scales (line above ensures they have different values)
            expect(features[0].point.pixelSize.getValue()).not.toEqual(features[1].point.pixelSize.getValue());
        }).then(done).otherwise(done.fail);
    });

});
