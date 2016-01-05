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

});