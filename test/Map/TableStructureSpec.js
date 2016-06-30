'use strict';

/*global require,describe,it,expect*/
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var TableStructure = require('../../lib/Map/TableStructure');
// var TableColumn = require('../../lib/Map/TableColumn');
var VarType = require('../../lib/Map/VarType');

var separator = ',';
if (typeof Intl === 'object' && typeof Intl.NumberFormat === 'function') {
    separator = (Intl.NumberFormat().format(1000)[1]);
}

describe('TableStructure', function() {

    it('can read from json object', function() {
        // Use a copy of data to make the column, because knockout adds stuff to data.
        // Also, test a "slice" of the column's values, to remove knockout stuff.
        var data = [['x', 'y'], [1, 5], [3, 8], [4, -3]];
        var tableStructure = TableStructure.fromJson(data.slice());
        expect(tableStructure.columns.length).toEqual(2);
        expect(tableStructure.columns[0].name).toEqual('x');
        expect(tableStructure.columns[0].values.slice()).toEqual([1, 3, 4]);
        expect(tableStructure.columns[1].name).toEqual('y');
        expect(tableStructure.columns[1].values.slice()).toEqual([5, 8, -3]);
    });

    it('can read from csv string', function() {
        var csvString = 'x,y\r\n1,5\r\n3,8\r\n4,-3\r\n';
        var tableStructure = TableStructure.fromCsv(csvString);
        expect(tableStructure.columns.length).toEqual(2);
        expect(tableStructure.columns[0].name).toEqual('x');
        expect(tableStructure.columns[0].values.slice()).toEqual([1, 3, 4]);
        expect(tableStructure.columns[1].name).toEqual('y');
        expect(tableStructure.columns[1].values.slice()).toEqual([5, 8, -3]);
    });

    it('can read from json object into existing structure', function() {
        var data = [['x', 'y'], [1, 5], [3, 8], [4, -3]];
        var tableStructure = new TableStructure();
        tableStructure.loadFromJson(data);
        expect(tableStructure.columns.length).toEqual(2);
        expect(tableStructure.columns[0].name).toEqual('x');
        expect(tableStructure.columns[0].values.slice()).toEqual([1, 3, 4]);
        expect(tableStructure.columns[1].name).toEqual('y');
        expect(tableStructure.columns[1].values.slice()).toEqual([5, 8, -3]);
    });

    it('can read from csv string into existing structure', function() {
        var csvString = 'x,y\r\n1,5\r\n3,8\r\n4,-3\r\n';
        var tableStructure = new TableStructure();
        tableStructure.loadFromCsv(csvString);
        expect(tableStructure.columns.length).toEqual(2);
        expect(tableStructure.columns[0].name).toEqual('x');
        expect(tableStructure.columns[0].values.slice()).toEqual([1, 3, 4]);
        expect(tableStructure.columns[1].name).toEqual('y');
        expect(tableStructure.columns[1].values.slice()).toEqual([5, 8, -3]);
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
        var data = [['x', 'y'], ['1', '5'], ['3', '8'], ['4', '-3']];
        var tableStructure = TableStructure.fromJson(data);
        var rows = tableStructure.toArrayOfRows();
        expect(rows.length).toEqual(4);
        expect(rows).toEqual(data);
    });

    it('can convert to ArrayOfRows with formatting', function() {
        var data = [['x', 'y'], [1.678, 9.883], [54321, 12345], [4, -3]];
        var options = {columnOptions: {
            x: {format: {maximumFractionDigits: 0}},
            y: {name: 'new y', format: {useGrouping: true, maximumFractionDigits: 1}}
        }};
        var target = [['x', 'new y'], ['2', '9.9'], ['54321', '12' + separator + '345'], ['4', '-3']];
        var tableStructure = new TableStructure('foo', options);
        tableStructure = tableStructure.loadFromJson(data);
        var rows = tableStructure.toArrayOfRows();
        expect(rows.length).toEqual(4);
        expect(rows).toEqual(target);
    });

    it('can convert to csv', function() {
        var data = [['x', 'y'], [1.678, 9.883], [54321, 12345], [4, -3]];
        var tableStructure = new TableStructure();
        tableStructure = tableStructure.loadFromJson(data);
        var csvString = tableStructure.toCsvString();
        expect(csvString).toEqual('x,y\n1.678,9.883\n54321,12345\n4,-3');
    });

    it('can convert to row objects', function() {
        var data = [['x', 'y'], [1, 5.12345], [3, 8], [4, -3]];
        var tableStructure = TableStructure.fromJson(data);
        var rowObjects = tableStructure.toRowObjects();
        expect(rowObjects.length).toEqual(3);
        expect(rowObjects[0]).toEqual({x: '1', y: '5.12345'});
        expect(rowObjects[1]).toEqual({x: '3', y: '8'});
        expect(rowObjects[2]).toEqual({x: '4', y: '-3'});
    });

    it('can convert to point arrays', function() {
        var data = [['a', 'b', 'c'], [1, 2, 3], [4, 5, 6], [7, 8, 9]];
        var tableStructure = TableStructure.fromJson(data);
        var xy = tableStructure.toPointArrays();
        expect(xy.length).toEqual(2);
        expect(xy[0]).toEqual([{x: 1, y: 2}, {x: 4, y: 5}, {x: 7, y: 8}]);
        expect(xy[1]).toEqual([{x: 1, y: 3}, {x: 4, y: 6}, {x: 7, y: 9}]);
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

    it('ignores final blank rows of CSV files', function() {
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

        csvString = csvString + '\n\n\n\n\n';
        tableStructure = new TableStructure();
        tableStructure.loadFromCsv(csvString);
        expect(tableStructure.columns[0].values.length).toEqual(2);
        expect(tableStructure.columns[1].values.length).toEqual(2);
    });

    it('can read csv string where column names are numbers', function() {
        var csvString = '1,2\n9,8\n7,6';
        var tableStructure = new TableStructure();
        tableStructure.loadFromCsv(csvString);
        expect(tableStructure.columns[0].name).toEqual('1');
        expect(tableStructure.columns[1].name).toEqual('2');
    });

    it('can describe rows with dates with and without timezones nicely', function() {
        var csvString = 'date,value\r\n2015-10-15T12:34:56,5\r\n2015-10-02T12:34:56Z,8\r\n2015-11-03\r\n';
        var tableStructure = TableStructure.fromCsv(csvString);
        var htmls = tableStructure.toRowDescriptions();
        expect(htmls[0]).toContain('Thu Oct 15 2015 12:34:56');  // Thu 15 Oct would be nicer outside USA.
        expect(htmls[0]).not.toContain('2015-10-15T12:34:56');
        var expectedDate1 = JulianDate.toDate(JulianDate.fromIso8601('2015-10-02T12:34:56Z'));
        expect(htmls[1]).toContain('' + expectedDate1);
        expect(htmls[1]).not.toContain('2015-10-02T12:34:56');
        expect(htmls[2]).toContain('>2015-11-03<'); // No time is added when only the date is given.
    });

    it('can describe rows with formatting', function() {
        var data = [['x', 'y'], [1.678, 5.123], [54321, 12345], [4, -3]];
        var options = {columnOptions: {y: {name: 'new y', format: {useGrouping: true, maximumFractionDigits: 1}}}};
        var tableStructure = new TableStructure('foo', options);
        tableStructure = tableStructure.loadFromJson(data);
        var htmls = tableStructure.toRowDescriptions();
        expect(htmls[0]).toContain('new y');
        expect(htmls[0]).toContain('1.678');
        expect(htmls[0]).toContain('5.1');
        expect(htmls[0]).not.toContain('5.12');
        expect(htmls[1]).toContain('54321');
        expect(htmls[1]).toContain('12' + separator + '345');
    });

    // it('can synthesize from column arrays', function() {
    //     var c1 = new TableColumn('col1', [20, 10, 30]);
    //     var c2 = new TableColumn('col2', [1, 2, 3]);
    //     var c3 = new TableColumn('col3', [15, 45]);
    //     var c4 = new TableColumn('col4', [4, 5]);
    //     var result = TableStructure.fromColumnArrays([[c1, c2], [c3, c4]]);
    //     var valueArrays = result.columns.map(function(column) { return column.values; });
    //     expect(valueArrays).toEqual([[10, 15, 20, 30, 45], [2, undefined, 1, 3, undefined], [undefined, 4, undefined, undefined, 5]]);
    //     var names = result.columns.map(function(column) { return column.name; });
    //     expect(names).toEqual(['col1', 'col2', 'col4']);
    // });

    // it('can synthesize from column arrays, with repeated x-values', function() {
    //     var c1 = new TableColumn('col1', [20, 10, 30]);
    //     var c2 = new TableColumn('col2', [1, 2, 3]);
    //     var c3 = new TableColumn('col3', [15, 20]);
    //     var c4 = new TableColumn('col4', [4, 5]);
    //     var c5 = new TableColumn('col5', [20, 25]);
    //     var c6 = new TableColumn('col6', [6, 7]);
    //     var result = TableStructure.fromColumnArrays([[c1, c2], [c3, c4], [c5, c6]]);
    //     var valueArrays = result.columns.map(function(column) { return column.values; });
    //     expect(valueArrays).toEqual([[10, 15, 20, 25, 30], [2, undefined, 1, undefined, 3], [undefined, 4, 5, undefined, undefined], [undefined, undefined, 6, 7, undefined]]);
    // });

    // it('can synthesize from column arrays, with dates in different formats', function() {
    //     var c1 = new TableColumn('col1', ['2016', '2015', '2017'], {type: VarType.TIME});
    //     var c2 = new TableColumn('col2', [1, 2, 3]);
    //     var c3 = new TableColumn('date', ['2015-06-01', '2016-01-01']);
    //     var c4 = new TableColumn('col4', [4, 5]);
    //     var c5 = new TableColumn('col5', ['2016', '2016-06'],  {type: VarType.TIME});
    //     var c6 = new TableColumn('col6', [6, 7]);
    //     var result = TableStructure.fromColumnArrays([[c1, c2], [c3, c4], [c5, c6]]);
    //     var valueArrays = result.columns.map(function(column) { return column.values; });
    //     // Don't test the exact representation of the dates, since that depends on the timezone this is running in.
    //     // However, this does test that there are only 5 rows, and that '2016-01-01' was combined with '2016', etc.
    //     expect(valueArrays.slice(1)).toEqual([[2, undefined, 1, undefined, 3], [undefined, 4, 5, undefined, undefined], [undefined, undefined, 6, 7, undefined]]);
    // });

});
