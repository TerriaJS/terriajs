'use strict';

var Clock = require('../../lib/Models/Clock');
var CatalogItem = require('../../lib/Models/CatalogItem');
var Terria = require('../../lib/Models/Terria');
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');

describe('Clock', function() {
    var clock, terria, catalogItem;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        clock = new Clock();
        catalogItem = new CatalogItem(terria);
    });

    it('should allow catalogTime to be get and set as normal', function() {
        var date = JulianDate.fromIso8601('1941-12-05');

        expect(clock.currentTime).not.toBe(date);
        clock.currentTime = date;
        expect(clock.currentTime).toBe(date);
    });

    describe('when set with a catalogItem that has intervals', function() {
        beforeEach(function() {
            catalogItem.intervals = [
                new
            ];
        });
    });
});
