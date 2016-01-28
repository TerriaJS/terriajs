'use strict';

/*global require,describe,it,expect*/
var TableStructure = require('../../lib/Core/TableStructure');
var VarType = require('../../lib/Map/VarType');

describe('TableStructure', function() {

    it('can read from json object', function() {
        var data = [['x', 'y'], [1, 5], [3, 8], [4, -3]];
        var tableStructure = TableStructure.fromJson(data);
        expect(tableStructure.columns.length).toEqual(2);
        expect(tableStructure.columns[0].name).toEqual('x');
        expect(tableStructure.columns[0].values).toEqual([1, 3, 4]);
        expect(tableStructure.columns[1].name).toEqual('y');
        expect(tableStructure.columns[1].values).toEqual([5, 8, -3]);
    });

    it('can read from csv string', function() {
        var csvString = 'x,y\r\n1,5\r\n3,8\r\n4,-3\r\n';
        var tableStructure = TableStructure.fromCsv(csvString);
        expect(tableStructure.columns.length).toEqual(2);
        expect(tableStructure.columns[0].name).toEqual('x');
        expect(tableStructure.columns[0].values).toEqual([1, 3, 4]);
        expect(tableStructure.columns[1].name).toEqual('y');
        expect(tableStructure.columns[1].values).toEqual([5, 8, -3]);
    });

    it('can read from json object into existing structure', function() {
        var data = [['x', 'y'], [1, 5], [3, 8], [4, -3]];
        var tableStructure = new TableStructure();
        tableStructure.loadFromJson(data);
        expect(tableStructure.columns.length).toEqual(2);
        expect(tableStructure.columns[0].name).toEqual('x');
        expect(tableStructure.columns[0].values).toEqual([1, 3, 4]);
        expect(tableStructure.columns[1].name).toEqual('y');
        expect(tableStructure.columns[1].values).toEqual([5, 8, -3]);
    });

    it('can read from csv string into existing structure', function() {
        var csvString = 'x,y\r\n1,5\r\n3,8\r\n4,-3\r\n';
        var tableStructure = new TableStructure();
        tableStructure.loadFromCsv(csvString);
        expect(tableStructure.columns.length).toEqual(2);
        expect(tableStructure.columns[0].name).toEqual('x');
        expect(tableStructure.columns[0].values).toEqual([1, 3, 4]);
        expect(tableStructure.columns[1].name).toEqual('y');
        expect(tableStructure.columns[1].values).toEqual([5, 8, -3]);
    });

    it('can convert to ArrayOfColumns', function() {
        var data = [['x', 'y'], [1, 5], [3, 8], [4, -3]];
        var tableStructure = TableStructure.fromJson(data);
        var columns = tableStructure.toArrayOfColumns();
        expect(columns.length).toEqual(2);
        expect(columns[0]).toEqual(['x', 1, 3, 4]);
        expect(columns[1]).toEqual(['y', 5, 8, -3]);
    });

    it('can convert to ArrayOfRows', function() {
        var data = [['x', 'y'], [1, 5], [3, 8], [4, -3]];
        var tableStructure = TableStructure.fromJson(data);
        var rows = tableStructure.toArrayOfRows();
        expect(rows.length).toEqual(4);
        expect(rows).toEqual(data);
    });

    it('can convert to row objects', function() {
        var data = [['x', 'y'], [1, 5], [3, 8], [4, -3]];
        var tableStructure = TableStructure.fromJson(data);
        var rowObjects = tableStructure.toRowObjects();
        expect(rowObjects.length).toEqual(3);
        expect(rowObjects[0]).toEqual({x: 1, y: 5});
        expect(rowObjects[1]).toEqual({x: 3, y: 8});
        expect(rowObjects[2]).toEqual({x: 4, y: -3});
    });

    it('can get column names', function() {
        var data = [['x', 'y'], [1, 5], [3, 8], [4, -3]];
        var tableStructure = TableStructure.fromJson(data);
        expect(tableStructure.getColumnNames()).toEqual(['x', 'y']);
    });

    it('can get column with name', function() {
        var data = [['x', 'y'], [1, 5], [3, 8], [4, -3]];
        var tableStructure = TableStructure.fromJson(data);
        expect(tableStructure.getColumnWithName('y')).toEqual(tableStructure.columns[1]);
        expect(tableStructure.getColumnWithName('z')).toBeUndefined();
    });

    it('sets column types', function() {
        var data = [['x', 'lat'], [1, 5], [3, 8], [4, -3]];
        var tableStructure = TableStructure.fromJson(data);
        expect(tableStructure.columnsByType[VarType.SCALAR].length).toEqual(1);
        expect(tableStructure.columnsByType[VarType.SCALAR][0].name).toEqual('x');
        expect(tableStructure.columnsByType[VarType.LAT].length).toEqual(1);
        expect(tableStructure.columnsByType[VarType.LAT][0].name).toEqual('lat');
    });

    it('counts the final row of CSV files with no trailing linefeed(s)', function() {
        var csvString = 'postcode,value\n0800,1\n0885,2';
        var tableStructure = new TableStructure();
        tableStructure.loadFromCsv(csvString);
        expect(tableStructure.columns[0].values.length).toEqual(2);
        expect(tableStructure.columns[1].values.length).toEqual(2);

        csvString = csvString + '\n';
        tableStructure = new TableStructure();
        tableStructure.loadFromCsv(csvString);
        expect(tableStructure.columns[0].values.length).toEqual(2);
        expect(tableStructure.columns[1].values.length).toEqual(2);

        // The ABS returns a csv data file for Australia with two final linefeeds.
        csvString = csvString + '\n';
        tableStructure = new TableStructure();
        tableStructure.loadFromCsv(csvString);
        expect(tableStructure.columns[0].values.length).toEqual(2);
        expect(tableStructure.columns[1].values.length).toEqual(2);
    });

    it('ignores a final blank row of CSV files', function() {
        var csvString = 'postcode,value\n0800,1,\n0885,2,';
        var tableStructure = new TableStructure();
        tableStructure.loadFromCsv(csvString);
        expect(tableStructure.columns[0].values.length).toEqual(2);
        expect(tableStructure.columns[1].values.length).toEqual(2);

        csvString = csvString + '\n';
        tableStructure = new TableStructure();
        tableStructure.loadFromCsv(csvString);
        expect(tableStructure.columns[0].values.length).toEqual(2);
        expect(tableStructure.columns[1].values.length).toEqual(2);
    });

    it('can describe rows with dates with and without timezones nicely', function() {
        var csvString = 'date,value\r\n2015-10-01T12:34:56,5\r\n2015-10-02T12:34:56Z,8\r\n2015-10-03\r\n';
        var tableStructure = TableStructure.fromCsv(csvString);
        var htmls = tableStructure.toRowDescriptions();
        expect(htmls[0]).toContain('Thu Oct 01 2015 12:34:56');  // Thu 01 Oct would be nicer outside USA.
        expect(htmls[0]).not.toContain('2015-10-01T12:34:56');
        expect(htmls[1]).toContain(':56');  // Depending on the time zone this is run in, could be anything.
        expect(htmls[1]).toContain('GMT');
        expect(htmls[1]).not.toContain('2015-10-02T12:34:56');
        expect(htmls[2]).toContain('>2015-10-03<'); // No time is added when only the date is given.
    });

    // it('does not allow multiple selected variables by default', function(done) {
    //     var dataTable = new DataTable();
    //     loadText('/test/csv/lat_lon_enum_val.csv').then(function(text) {
    //         dataTable.loadText(text);
    //         expect(dataTable.getDataVariables().slice()).toEqual([]);
    //         dataTable.setDataVariable('enum');
    //         expect(dataTable.selectedNames.slice()).toEqual(['enum']);
    //         dataTable.setDataVariable('val');
    //         expect(dataTable.selectedNames.slice()).toEqual(['val']);
    //         // also test turning off the variable
    //         dataTable.setDataVariable('val', false);
    //         expect(dataTable.getDataVariables().slice()).toEqual([]);
    //     }).then(done).otherwise(done.fail);
    // });

    // it('can allow multiple selected variables', function(done) {
    //     var dataTable = new DataTable({allowMultiple: true});
    //     loadText('/test/csv/lat_lon_enum_val.csv').then(function(text) {
    //         dataTable.loadText(text);
    //         expect(dataTable.getDataVariables().slice()).toEqual([]);
    //         dataTable.setDataVariable('enum');
    //         expect(dataTable.getDataVariables().slice()).toEqual(['enum']);
    //         dataTable.setDataVariable('val');
    //         expect(dataTable.getDataVariables().slice()).toEqual(['enum', 'val']);
    //         // also test turning off the variables
    //         dataTable.setDataVariable('val');
    //         expect(dataTable.getDataVariables().slice()).toEqual(['enum']);
    //         dataTable.setDataVariable('enum');
    //         expect(dataTable.getDataVariables().slice()).toEqual([]);
    //     }).then(done).otherwise(done.fail);
    // });

});