'use strict';

/*global require,describe,it,expect*/
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');

var TableColumn = require('../../lib/Core/TableColumn');
var VarType = require('../../lib/Map/VarType');

describe('TableColumn', function() {

    it('can make a new object and detect scalar type', function() {
        var data = [1, 3, 4];
        var tableColumn = new TableColumn('x', data);
        expect(tableColumn.name).toEqual('x');
        expect(tableColumn.values).toEqual(data);
        expect(tableColumn.type).toEqual(VarType.SCALAR);
    });

    it('can detect latitude type', function() {
        var data = [30.3, 31.3, 33.3];
        var tableColumn = new TableColumn('lat', data);
        expect(tableColumn.type).toEqual(VarType.LAT);
    });

    it('can detect longitude type', function() {
        var data = [130.3, 131.3, 133.3];
        var tableColumn = new TableColumn('lon', data);
        expect(tableColumn.type).toEqual(VarType.LON);
    });

    it('can detect time type from yyyy-mm-dd', function() {
        var data = ['2016-01-03', '2016-01-04'];
        var tableColumn = new TableColumn('date', data);
        expect(tableColumn.type).toEqual(VarType.TIME);
        expect(tableColumn.values).toEqual(data);
        // don't test equality using new Date() because different browsers handle timezones differently
        // so just check the date is right.
        expect(tableColumn.dates[0].getDate()).toEqual(3);
        expect(tableColumn.dates[0].getMonth()).toEqual(0); // January is month 0
        expect(tableColumn.dates[0].getFullYear()).toEqual(2016);
    });

    it('can detect time type from dd-mm-yyyy', function() {
        var data = ['31-12-2015', '04-01-2016'];
        var tableColumn = new TableColumn('date', data);
        expect(tableColumn.type).toEqual(VarType.TIME);
        expect(tableColumn.values).toEqual(data);
        expect(tableColumn.dates[1].getDate()).toEqual(4);
        expect(tableColumn.dates[1].getMonth()).toEqual(0); // January is month 0
        expect(tableColumn.dates[1].getFullYear()).toEqual(2016);
    });

    it('can detect time type from mm-dd-yyyy', function() {
        var data = ['12-31-2015', '01-04-2016'];
        var tableColumn = new TableColumn('date', data);
        expect(tableColumn.type).toEqual(VarType.TIME);
        expect(tableColumn.values).toEqual(data);
        expect(tableColumn.dates[1].getDate()).toEqual(4);
        expect(tableColumn.dates[1].getMonth()).toEqual(0); // January is month 0
        expect(tableColumn.dates[1].getFullYear()).toEqual(2016);
    });

    it('can detect ISO8601 UTC time type', function() {
        var data = ['2016-01-03T12:15:59.1234Z', '2016-01-03T12:25:00Z'];
        var tableColumn = new TableColumn('date', data);
        expect(tableColumn.type).toEqual(VarType.TIME);
        expect(tableColumn.values).toEqual(data);
        expect(tableColumn.dates[0].getUTCDate()).toEqual(3);
        expect(tableColumn.dates[0].getUTCMonth()).toEqual(0); // January is month 0
        expect(tableColumn.dates[0].getUTCFullYear()).toEqual(2016);
        expect(tableColumn.dates[0].getUTCHours()).toEqual(12);
        expect(tableColumn.dates[0].getUTCMinutes()).toEqual(15);
        expect(tableColumn.dates[0].getUTCSeconds()).toEqual(59);
        expect(tableColumn.dates[0].getUTCMilliseconds()).toEqual(123);
    });

    it('can calculate finish dates', function() {
        var data = ['2016-01-03T12:15:00Z', '2016-01-03T12:15:30Z'];
        var tableColumn = new TableColumn('date', data);
        expect(tableColumn.finishJulianDates).toEqual([
            JulianDate.fromIso8601('2016-01-03T12:15:29Z'),
            JulianDate.fromIso8601('2016-01-03T12:16:00Z') // Final one should have the average spacing, 30 sec.
        ]);
    });

    it('can calculate sub-second finish dates', function() {
        var data = ['2016-01-03T12:15:00Z', '2016-01-03T12:15:00.4Z', '2016-01-03T12:15:01Z'];
        var tableColumn = new TableColumn('date', data);
        
        expect(tableColumn.finishJulianDates).toEqual([
            JulianDate.fromIso8601('2016-01-03T12:15:00.38Z'), // Shaves off 5% of 0.4, ie. 0.02.
            JulianDate.fromIso8601('2016-01-03T12:15:00.97Z'), // Shaves off 5% of 0.6, ie. 0.03.
            JulianDate.fromIso8601('2016-01-03T12:15:01.5Z') // Average spacing is 0.5 second.
        ]);
    });

    it('treats numerical data in a column named time as scalars', function() {
        var data = [730, 1230, 130];
        var tableColumn = new TableColumn('date', data);
        expect(tableColumn.type).toEqual(VarType.SCALAR);
        expect(tableColumn.values).toEqual(data);
    });

});