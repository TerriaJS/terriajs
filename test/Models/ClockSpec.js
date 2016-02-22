'use strict';

var Clock = require('../../lib/Models/Clock');
var ImageryLayerCatalogItem = require('../../lib/Models/ImageryLayerCatalogItem');
var Terria = require('../../lib/Models/Terria');
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var TimeInterval = require('terriajs-cesium/Source/Core/TimeInterval');
var DataSourceClock = require('terriajs-cesium/Source/DataSources/DataSourceClock');
var TimeIntervalCollection = require('terriajs-cesium/Source/Core/TimeIntervalCollection');

describe('Clock', function() {
    var clock, terria, catalogItem;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        clock = new Clock();
        catalogItem = new ImageryLayerCatalogItem(terria);
        catalogItem.clock = new DataSourceClock({
            startTime: JulianDate.fromIso8601('2016-01-01'),
            stopTime: JulianDate.fromIso8601('2016-01-24')
        });
        clock.setCatalogItem(catalogItem);
    });

    it('should allow catalogTime to be get and set as normal if no intervals defined', function() {
        var date = JulianDate.fromIso8601('1941-12-05');

        expect(clock.currentTime).not.toBe(date);
        clock.currentTime = date;
        expect(clock.currentTime).toBe(date);
    });

    describe('when set with a catalogItem that has intervals', function() {
        beforeEach(function() {
            catalogItem.intervals = new TimeIntervalCollection([
                new TimeInterval({
                    start: JulianDate.fromIso8601('2016-01-01'),
                    stop: JulianDate.fromIso8601('2016-01-07')
                }),
                new TimeInterval({
                    start: JulianDate.fromIso8601('2016-01-12'),
                    stop: JulianDate.fromIso8601('2016-01-15')
                }),
                new TimeInterval({
                    start: JulianDate.fromIso8601('2016-01-20'),
                    stop: JulianDate.fromIso8601('2016-01-24')
                })
            ]);
        });

        describe('currentTime', function() {
            it('is set as normal if time is within interval', function() {
                var date = JulianDate.fromIso8601('2016-01-02');

                expect(clock.currentTime).not.toBe(date);
                clock.currentTime = date;
                expect(clock.currentTime).toBe(date);
            });

            it('is shifted to start of next interval if in a gap', function() {
                clock.currentTime = JulianDate.fromIso8601('2016-01-08');
                expect(clock.currentTime).toEqual(JulianDate.fromIso8601('2016-01-12'));
            });
        });
    });
});
