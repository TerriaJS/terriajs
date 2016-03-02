'use strict';

/*global require,describe,it,expect*/
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var TableStructure = require('../../lib/Map/TableStructure');
var VarType = require('../../lib/Map/VarType');

var separator = ',';
if (typeof Intl === 'object') {
    separator = (typeof Intl.NumberFormat === 'function' && Intl.NumberFormat().format(1000)[1]);
}

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

    it('can describe rows with dates with and without timezones nicely', function() {
        var csvString = 'date,value\r\n2015-10-15T12:34:56,5\r\n2015-10-02T12:34:56Z,8\r\n2015-11-03\r\n';
        var tableStructure = TableStructure.fromCsv(csvString);
        var htmls = tableStructure.toRowDescriptions();
        expect(htmls[0]).toContain('Thu Oct 15 2015 12:34:56');  // Thu 15 Oct would be nicer outside USA.
        expect(htmls[0]).not.toContain('2015-10-15T12:34:56');
        // expect(htmls[1]).toContain(':56');  // Depending on the time zone this is run in, could be anything.
        // expect(htmls[1].indexOf('GMT') + htmls[1].indexOf('UTC')).toBeGreaterThan(-2);  // The time zone is shown, IE9 uses UTC, others GMT.
        // expect(htmls[1]).not.toContain('2015-10-02T12:34:56');
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


});
