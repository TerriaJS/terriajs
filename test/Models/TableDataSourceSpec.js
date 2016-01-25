'use strict';

/*global require*/
var loadText = require('terriajs-cesium/Source/Core/loadText');
var TableDataSource = require('../../lib/Models/TableDataSource');
var TableStyle = require('../../lib/Models/TableStyle');

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
            tableDataSource.loadFromCsv(text);
            expect(tableDataSource.tableStructure.hasLatitudeAndLongitude).toEqual(true);
        }).then(done).otherwise(done.fail);
    });

    it('does not set the clock when there is no date column', function(done) {
        loadText('/test/csv/lat_lon_val.csv').then(function(text) {
            tableDataSource.loadFromCsv(text);
            expect(tableDataSource.clock).toBeUndefined();
        }).then(done).otherwise(done.fail);
    });

    it('sets the clock when there is a date column', function(done) {
        loadText('/test/csv/lat_long_enum_moving_date.csv').then(function(text) {
            tableDataSource.loadFromCsv(text);
            expect(tableDataSource.clock).toBeDefined();
        }).then(done).otherwise(done.fail);
    });

    it('scales points', function(done) {
        var tableStyle = new TableStyle({
            scaleByValue: true,
            scale: 5
        });
        tableDataSource.tableStyle = tableStyle;
        loadText('/test/csv/lat_lon_enum_val.csv').then(function(text) {
            tableDataSource.loadFromCsv(text);
            tableDataSource.tableStructure.columns[3].toggleActive();
            var features = tableDataSource.entities.values;
            expect(tableDataSource.tableStructure.columns[0].values).not.toEqual(tableDataSource.tableStructure.columns[1].values);
            // expect the first two features to have different scales (line above ensures they have different values)
            expect(features[0].point.pixelSize.getValue()).not.toEqual(features[1].point.pixelSize.getValue());
        }).then(done).otherwise(done.fail);
    });

});
