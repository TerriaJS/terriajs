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

});
