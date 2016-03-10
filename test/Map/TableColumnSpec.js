'use strict';

/*global require,describe,it,expect*/
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');

var TableColumn = require('../../lib/Map/TableColumn');
var VarType = require('../../lib/Map/VarType');
var VarSubType = require('../../lib/Map/VarSubType');

describe('TableColumn', function() {

    it('can make a new object and detect scalar type', function() {
        var data = [1, 3, 4];
        var tableColumn = new TableColumn('x', data);
        expect(tableColumn.name).toEqual('x');
        expect(tableColumn.values).toEqual(data);
        expect(tableColumn.type).toEqual(VarType.SCALAR);
    });

    it('treats null, NA and hyphens as null in numeric data', function() {
        var data = [1, 'NA', 4, '-', null, 3];
        var tableColumn = new TableColumn('x', data);
        expect(tableColumn.name).toEqual('x');
        expect(tableColumn.values).toEqual([1, null, 4, null, null, 3]);
        expect(tableColumn.type).toEqual(VarType.SCALAR);
    });

    it('treats hyphens, blanks and NA as strings in string data', function() {
        var data = ['%', '-', '!', 'NA', ''];
        var tableColumn = new TableColumn('x', data);
        expect(tableColumn.name).toEqual('x');
        expect(tableColumn.values).toEqual(data);
        expect(tableColumn.type).toEqual(VarType.ENUM);
    });

    it('provides a null index for a null value in string data', function() {
        var data = ['small', 'medium', null, 'big'];
        var tableColumn = new TableColumn('size', data);
        expect(tableColumn.type).toEqual(VarType.ENUM);
        expect(tableColumn.usesIndicesIntoUniqueValues).toBe(true);
        expect(tableColumn.indicesOrValues[1]).not.toBe(null);
        expect(tableColumn.indicesOrValues[2]).toBe(null);
    });

    it('ignores missing values when calculating min/max', function() {
        var data = [130.3, 131.3, null, 133.3];
        var tableColumn = new TableColumn('lat', data);
        expect(tableColumn.maximumValue).toBe(133.3);
        expect(tableColumn.minimumValue).toBe(130.3);
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

    it('can detect address type', function() {
        var data = ["7 London Circuit Canberra City ACT 2601"];
        var tableColumn = new TableColumn('address', data);
        expect(tableColumn.type).toEqual(VarType.ADDR);
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

    it('can detect time type and year subtype from yyyy', function() {
        var data = ['2010', '2011', '2012', '2013'];
        var tableColumn = new TableColumn('date', data);
        expect(tableColumn.type).toEqual(VarType.TIME);
        expect(tableColumn.subtype).toEqual(VarSubType.YEAR);
        expect(tableColumn.values).toEqual(data);
        // don't test equality using new Date() because different browsers handle timezones differently
        // so just check the date is right.
        expect(tableColumn.dates[0].getDate()).toEqual(1);
        expect(tableColumn.dates[0].getMonth()).toEqual(0); // January is month 0
        expect(tableColumn.dates[0].getFullYear()).toEqual(2010);
    });

    it('can detect time type from yyyy-mm', function() {
        var data = ['2010-01', '2010-02', '2010-03', '2010-04'];
        var tableColumn = new TableColumn('date', data);
        expect(tableColumn.type).toEqual(VarType.TIME);
        expect(tableColumn.values).toEqual(data);
        expect(tableColumn.dates[1].getDate()).toEqual(1);
        expect(tableColumn.dates[1].getMonth()).toEqual(1); // January is month 0
        expect(tableColumn.dates[1].getFullYear()).toEqual(2010);
    });

    // This format can actually work, but we don't want to encourage it.
    // it('can detect time type from yyyy/mm/dd h:mm:ss', function() {
    //     var data = ['2010/02/12 12:34:56', '2010/02/13 1:23:45'];
    //     var tableColumn = new TableColumn('date', data);
    //     expect(tableColumn.type).toEqual(VarType.TIME);
    //     expect(tableColumn.values).toEqual(data);
    //     expect(tableColumn.dates[1].getDate()).toEqual(13);
    //     expect(tableColumn.dates[1].getMonth()).toEqual(1); // January is month 0
    //     expect(tableColumn.dates[1].getFullYear()).toEqual(2010);
    //     expect(tableColumn.dates[1].getHours()).toEqual(1);
    //     expect(tableColumn.dates[1].getMinutes()).toEqual(23);
    //     expect(tableColumn.dates[1].getSeconds()).toEqual(45);
    // });

    it('can detect time type from yyyy-mm-dd h:mm', function() {
        var data = ['2010-02-12 12:34', '2010-02-13 1:23'];
        var tableColumn = new TableColumn('date', data);
        expect(tableColumn.type).toEqual(VarType.TIME);
        expect(tableColumn.values).toEqual(data);
        expect(tableColumn.dates[1].getDate()).toEqual(13);
        expect(tableColumn.dates[1].getMonth()).toEqual(1); // January is month 0
        expect(tableColumn.dates[1].getFullYear()).toEqual(2010);
        expect(tableColumn.dates[1].getHours()).toEqual(1);
        expect(tableColumn.dates[1].getMinutes()).toEqual(23);
        expect(tableColumn.dates[1].getSeconds()).toEqual(0);
    });

    it('can detect time type from yyyy-mm-dd h:mm:ss', function() {
        var data = ['2010-02-12 12:34:56', '2010-02-13 1:23:45'];
        var tableColumn = new TableColumn('date', data);
        expect(tableColumn.type).toEqual(VarType.TIME);
        expect(tableColumn.values).toEqual(data);
        expect(tableColumn.dates[1].getDate()).toEqual(13);
        expect(tableColumn.dates[1].getMonth()).toEqual(1); // January is month 0
        expect(tableColumn.dates[1].getFullYear()).toEqual(2010);
        expect(tableColumn.dates[1].getHours()).toEqual(1);
        expect(tableColumn.dates[1].getMinutes()).toEqual(23);
        expect(tableColumn.dates[1].getSeconds()).toEqual(45);
    });

    it('can detect year subtype using year title', function() {
        var data = ['1066', '1776', '1788', '1901', '2220'];
        var tableColumn = new TableColumn('year', data);
        expect(tableColumn.type).toEqual(VarType.TIME);
        expect(tableColumn.subtype).toEqual(VarSubType.YEAR);
    });

    it('detects years from numerical data in a column named time', function() {
        var data = [730, 1230, 130];
        var tableColumn = new TableColumn('date', data);
        expect(tableColumn.type).toEqual(VarType.TIME);
        expect(tableColumn.subtype).toEqual(VarSubType.YEAR);
        expect(tableColumn.values).toEqual(data);
    });

    it('can handle missing times', function() {
        var data = ['2016-01-03T12:15:59.1234Z', '-', '2016-01-04T12:25:00Z'];
        var tableColumn = new TableColumn('date', data);
        expect(tableColumn.type).toEqual(VarType.TIME);
        expect(tableColumn.dates[0].getUTCDate()).toEqual(3);
        expect(tableColumn.dates[1]).toBeUndefined();
        expect(tableColumn.dates[2].getUTCDate()).toEqual(4);
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

    it('treats numerical data >= 9999 in a column named time as scalars', function() {
        var data = [9999, 1230, 130];
        var tableColumn = new TableColumn('date', data);
        expect(tableColumn.type).toEqual(VarType.SCALAR);
        expect(tableColumn.values).toEqual(data);
    });

    it('can detect tag type from <img>', function() {
        var data = ['<img src="foo">', '<img src="bar">'];
        var tableColumn = new TableColumn('image', data);
        expect(tableColumn.type).toEqual(VarType.TAG);
    });

    it('can detect tag type from <br/>', function() {
        var data = ['<br/>', '<br/>'];
        var tableColumn = new TableColumn('bar', data);
        expect(tableColumn.type).toEqual(VarType.TAG);
    });

    it('can detect tag type from <div>', function() {
        var data = ['<div>Foo</div>', '<div>Bar</div>'];
        var tableColumn = new TableColumn('foo', data);
        expect(tableColumn.type).toEqual(VarType.TAG);
    });

    it('does not use tag type for <<...>>', function() {
        var data = ['<<he>>', '<<she>>'];
        var tableColumn = new TableColumn('who', data);
        expect(tableColumn.type).toEqual(VarType.ENUM);
    });

    it('does not use tag type for <foo>', function() {
        var data = ['<foo>', '<foobar>'];
        var tableColumn = new TableColumn('fee', data);
        expect(tableColumn.type).toEqual(VarType.ENUM);
    });

    it('can sum three columns from array', function() {
        var tableColumns = [
            new TableColumn('one', [10, 1]),
            new TableColumn('two', [25, 2.5]),
            new TableColumn('three', [-2, 6])
        ];
        var result = TableColumn.sumValues(tableColumns);
        var target = [10 + 25 - 2, 1 + 2.5 + 6];
        expect(result).toEqual(target);
    });

    it('can sum three columns as arguments', function() {
        var result = TableColumn.sumValues(
            new TableColumn('one', [10, 1]),
            new TableColumn('two', [25, 2.5]),
            new TableColumn('three', [-2, 6])
        );
        var target = [10 + 25 - 2, 1 + 2.5 + 6];
        expect(result).toEqual(target);
    });

    it('can divide two columns\' values', function() {
        var result = TableColumn.divideValues(
            new TableColumn('num', [40, 3, 8]),
            new TableColumn('den', [10, 6, 0]),
            'bad'
        );
        var target = [4, 0.5, 'bad'];
        expect(result).toEqual(target);
    });

    it('supports displayDuration', function() {
        var data = ['2016-01-03', '2016-01-04', '2016-01-05'];
        var sevenDaysInMinutes = 60 * 24 * 7;
        var tableColumn = new TableColumn('date', data, {displayDuration: sevenDaysInMinutes});
        var availability = tableColumn.availabilities[0];
        expect(availability.contains(JulianDate.fromIso8601('2016-01-09'))).toBe(true);
        expect(availability.contains(JulianDate.fromIso8601('2016-01-11'))).toBe(false);
        var durationInSeconds = JulianDate.secondsDifference(availability.stop, availability.start);
        expect(durationInSeconds).toEqual(sevenDaysInMinutes * 60);
    });

});
