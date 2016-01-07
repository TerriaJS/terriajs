'use strict';

/*global require*/
var loadText = require('terriajs-cesium/Source/Core/loadText');
var DataTable = require('../../lib/Map/DataTable');

describe('DataTable', function() {

    it('can be constructed', function() {
        var dataTable = new DataTable();
        expect(dataTable).toBeDefined();
    });

    it('can load csv', function(done) {
        var dataTable = new DataTable();
        loadText('/test/csv/lat_lon_val.csv').then(function(text) {
            dataTable.loadText(text);
            var variables = dataTable.variables;
            expect(variables).toBeDefined();
            expect(variables.lat).toBeDefined();
            expect(variables.lon).toBeDefined();
            expect(variables.value).toBeDefined();
        }).then(done).otherwise(done.fail);
    });


});
