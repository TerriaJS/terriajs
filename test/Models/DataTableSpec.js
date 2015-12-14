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

    it('does not allow multiple selected variables by default', function(done) {
        var dataTable = new DataTable();
        loadText('/test/csv/lat_lon_enum_val.csv').then(function(text) {
            dataTable.loadText(text);
            expect(dataTable.getDataVariables().slice()).toEqual([]);
            dataTable.setDataVariable('enum');
            expect(dataTable.selectedNames.slice()).toEqual(['enum']);
            dataTable.setDataVariable('val');
            expect(dataTable.selectedNames.slice()).toEqual(['val']);
            // also test turning off the variable
            dataTable.setDataVariable('val', false);
            expect(dataTable.getDataVariables().slice()).toEqual([]);
        }).then(done).otherwise(done.fail);
    });

    it('can allow multiple selected variables', function(done) {
        var dataTable = new DataTable({allowMultiple: true});
        loadText('/test/csv/lat_lon_enum_val.csv').then(function(text) {
            dataTable.loadText(text);
            expect(dataTable.getDataVariables().slice()).toEqual([]);
            dataTable.setDataVariable('enum');
            expect(dataTable.getDataVariables().slice()).toEqual(['enum']);
            dataTable.setDataVariable('val');
            expect(dataTable.getDataVariables().slice()).toEqual(['enum', 'val']);
            // also test turning off the variables
            dataTable.setDataVariable('val');
            expect(dataTable.getDataVariables().slice()).toEqual(['enum']);
            dataTable.setDataVariable('enum');
            expect(dataTable.getDataVariables().slice()).toEqual([]);
        }).then(done).otherwise(done.fail);
    });

});
