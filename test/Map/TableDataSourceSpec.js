'use strict';

/*global require*/
var TableDataSource = require('../../lib/Map/TableDataSource');

var tableDataSource;

beforeEach(function() {
    tableDataSource = new TableDataSource();
});

describe('TableDataSource', function() {

    it('can be constructed', function() {
        expect(tableDataSource).toBeDefined();
    });

    it('can load csv into dataset variables', function(done) {
        tableDataSource.loadUrl('/test/csv/lat_lon_val.csv').then(function() {
            var variables = tableDataSource.dataset.variables;
            expect(variables).toBeDefined();
            expect(variables.lat).toBeDefined();
            expect(variables.lon).toBeDefined();
            expect(variables.value).toBeDefined();
            expect(tableDataSource.dataVariable).toEqual('value');
        }).then(done).otherwise(done.fail);
    });

    it('sets the default dataVariable ignoring lat and lon', function(done) {
        tableDataSource.loadUrl('/test/csv/lat_lon_val.csv').then(function() {
            expect(tableDataSource.dataVariable).toEqual('value');
        }).then(done).otherwise(done.fail);
    });

    it('does not set the clock when there is no date column', function(done) {
        tableDataSource.loadUrl('/test/csv/lat_lon_val.csv').then(function() {
            expect(tableDataSource.clock).toBeUndefined();
        }).then(done).otherwise(done.fail);
    });

    it('sets the clock when there is a date column', function(done) {
        tableDataSource.loadUrl('/test/csv/lat_long_enum_moving_date.csv').then(function() {
            expect(tableDataSource.clock).toBeDefined();
        }).then(done).otherwise(done.fail);
    });

    it('does not change the number of entities when setDisplayStyle is called', function(done) {
        tableDataSource.loadUrl('/test/csv/lat_lon_enum_val.csv').then(function() {
            var featureCount = tableDataSource.entities.values.length;
            tableDataSource.setDisplayStyle({dataVariable: 'val'});
            expect(tableDataSource.entities.values.length).toEqual(featureCount);
        }).then(done).otherwise(done.fail);
    });

    it('sets the dataVariable via setDataVariable', function(done) {
        tableDataSource.loadUrl('/test/csv/lat_lon_enum_val.csv').then(function() {
            expect(tableDataSource.dataVariable).toEqual('enum');
            tableDataSource.setDataVariable('val');
            expect(tableDataSource.dataVariable).toEqual('val');
        }).then(done).otherwise(done.fail);
    });

    it('scales points', function(done) {
        tableDataSource.loadUrl('/test/csv/lat_lon_enum_val.csv').then(function() {
            tableDataSource.setDisplayStyle({
                dataVariable: 'val',
                scaleByValue: true,
                scale: 5
            });
            var features = tableDataSource.entities.values;
            expect(tableDataSource.dataset.variables.val.vals[0]).not.toEqual(tableDataSource.dataset.variables.val.vals[1]);
            // expect the first two features to have different scales (line above ensures they have different values)
            expect(features[0].point.pixelSize.getValue()).not.toEqual(features[1].point.pixelSize.getValue());
        }).then(done).otherwise(done.fail);
    });

});
