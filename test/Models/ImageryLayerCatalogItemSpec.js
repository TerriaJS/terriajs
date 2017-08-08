'use strict';

/*global require,beforeEach*/
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var TimeIntervalCollection = require('terriajs-cesium/Source/Core/TimeIntervalCollection');
var TimeInterval = require('terriajs-cesium/Source/Core/TimeInterval');

var Terria = require('../../lib/Models/Terria');
var ImageryLayerCatalogItem = require('../../lib/Models/ImageryLayerCatalogItem');

describe('ImageryLayerCatalogItem', function() {

    describe('Time slider initial time as specified by initialTimeSource ', function() {

        var terria;
        var catalogItem;

        beforeEach(function() {
            terria = new Terria({
                baseUrl: './'
            });
            catalogItem = new ImageryLayerCatalogItem(terria);
        });

        // Future developers take note: some of these tests will stop working in August 3015.
        it('should be present if not provided', function() {
            catalogItem.intervals = new TimeIntervalCollection([
                    new TimeInterval({
                        start: JulianDate.fromIso8601('2015-08-07T00:00:00.00Z'),
                        stop: JulianDate.fromIso8601('3015-08-09T00:00:00.00Z')
                    })
            ]);
            var dateNow = (new Date()).toISOString();
            var currentTime = JulianDate.toIso8601(catalogItem.clock.currentTime, 3);
            // Do not compare time, because on some systems the second could have ticked over between getting the two times.
            dateNow = dateNow.substr(0, 10);
            currentTime = currentTime.substr(0, 10);
            expect(currentTime).toBe(dateNow);
        });

        it('should be start if "start" set', function() {
            catalogItem.initialTimeSource = 'start';
            catalogItem.intervals = new TimeIntervalCollection([
                    new TimeInterval({
                        start: JulianDate.fromIso8601('2013-08-07T00:00:00.00Z'),
                        stop: JulianDate.fromIso8601('2015-08-09T00:00:00.00Z')
                    })
            ]);
            var currentTime = JulianDate.toIso8601(catalogItem.clock.currentTime, 3);
            // Do not compare time, because on some systems the second could have ticked over between getting the two times.
            currentTime = currentTime.substr(0, 10);
            expect(currentTime).toBe('2013-08-07');
        });

        it('should be start if date specified is before range', function() {
            catalogItem.initialTimeSource = '2000-08-08';
            catalogItem.intervals = new TimeIntervalCollection([
                    new TimeInterval({
                        start: JulianDate.fromIso8601('2013-08-07T00:00:00.00Z'),
                        stop: JulianDate.fromIso8601('2015-08-09T00:00:00.00Z')
                    })
            ]);
            var currentTime = JulianDate.toIso8601(catalogItem.clock.currentTime, 3);
            // Do not compare time, because on some systems the second could have ticked over between getting the two times.
            currentTime = currentTime.substr(0, 10);
            expect(currentTime).toBe('2013-08-07');
        });

        it('should be current time if "present" set', function() {
            catalogItem.initialTimeSource = 'present';
            catalogItem.intervals = new TimeIntervalCollection([
                    new TimeInterval({
                        start: JulianDate.fromIso8601('2013-08-07T00:00:00.00Z'),
                        stop: JulianDate.fromIso8601('3115-08-09T00:00:00.00Z')
                    })
            ]);
            var dateNow = (new Date()).toISOString();
            var currentTime = JulianDate.toIso8601(catalogItem.clock.currentTime, 3);
            // Do not compare time, because on some systems the second could have ticked over between getting the two times.
            dateNow = dateNow.substr(0, 10);
            currentTime = currentTime.substr(0, 10);
            expect(currentTime).toBe(dateNow);
        });

        it('should be last time if "end" set', function() {
            catalogItem.initialTimeSource = 'end';
            catalogItem.intervals = new TimeIntervalCollection([
                    new TimeInterval({
                        start: JulianDate.fromIso8601('2013-08-07T00:00:00.00Z'),
                        stop: JulianDate.fromIso8601('2015-08-09T00:00:00.00Z')
                    })
            ]);
            var currentTime = JulianDate.toIso8601(catalogItem.clock.currentTime, 3);
            // Do not compare time, because on some systems the second could have ticked over between getting the two times.
            currentTime = currentTime.substr(0, 10);
            expect(currentTime).toBe('2015-08-09');
        });

        it('should be last time if date specified is after range', function() {
            catalogItem.initialTimeSource = '3015-08-08';
            catalogItem.intervals = new TimeIntervalCollection([
                    new TimeInterval({
                        start: JulianDate.fromIso8601('2013-08-07T00:00:00.00Z'),
                        stop: JulianDate.fromIso8601('2015-08-09T00:00:00.00Z')
                    })
            ]);
            var currentTime = JulianDate.toIso8601(catalogItem.clock.currentTime, 3);
            // Do not compare time, because on some systems the second could have ticked over between getting the two times.
            currentTime = currentTime.substr(0, 10);
            expect(currentTime).toBe('2015-08-09');
        });

        it('should be set to date specified if date is specified', function() {
            catalogItem.initialTimeSource = '2015-08-08T00:00:00.00Z';
            catalogItem.intervals = new TimeIntervalCollection([
                    new TimeInterval({
                        start: JulianDate.fromIso8601('2013-08-07T00:00:00.00Z'),
                        stop: JulianDate.fromIso8601('2015-08-11T00:00:00.00Z')
                    })
            ]);
            var currentTime = JulianDate.toIso8601(catalogItem.clock.currentTime, 3);
            // Do not compare time, because on some systems the second could have ticked over between getting the two times.
            currentTime = currentTime.substr(0, 10);
            expect(currentTime).toBe('2015-08-08');
        });

        it('should be set to start if date specified is before time range', function() {
            catalogItem.initialTimeSource = '2013-01-01';
            catalogItem.intervals = new TimeIntervalCollection([
                    new TimeInterval({
                        start: JulianDate.fromIso8601('2015-08-07T00:00:00.00Z'),
                        stop: JulianDate.fromIso8601('2015-08-09T00:00:00.00Z')
                    })
            ]);
            var currentTime = JulianDate.toIso8601(catalogItem.clock.currentTime, 3);
            // Do not compare time, because on some systems the second could have ticked over between getting the two times.
            currentTime = currentTime.substr(0, 10);
            expect(currentTime).toBe('2015-08-07');
        });

        it('should be set to start if date specified is before time range, with two intervals', function() {
            catalogItem.initialTimeSource = '2012-01-01T12:00:00Z';
            catalogItem.intervals = new TimeIntervalCollection([
                new TimeInterval({
                    start: JulianDate.fromIso8601('2013-08-01T15:00:00Z'),
                    stop: JulianDate.fromIso8601('2013-08-01T18:00:00Z')
                }),
                new TimeInterval({
                    start: JulianDate.fromIso8601('2013-09-01T11:00:00Z'),
                    stop: JulianDate.fromIso8601('2013-09-03T13:00:00Z')
                })
            ]);
            var currentTime = JulianDate.toIso8601(catalogItem.clock.currentTime, 3);
            // Do not compare time, because on some systems the second could have ticked over between getting the two times.
            currentTime = currentTime.substr(0, 10);
            expect(currentTime).toBe('2013-08-01');
        });

        it('should be set to end if date specified is after time range', function() {
            catalogItem.initialTimeSource = '2222-08-08';
            catalogItem.intervals = new TimeIntervalCollection([
                    new TimeInterval({
                        start: JulianDate.fromIso8601('2015-08-07T00:00:00.00Z'),
                        stop: JulianDate.fromIso8601('2015-08-09T00:00:00.00Z')
                    })
            ]);
            var currentTime = JulianDate.toIso8601(catalogItem.clock.currentTime, 3);
            // Do not compare time, because on some systems the second could have ticked over between getting the two times.
            currentTime = currentTime.substr(0, 10);
            expect(currentTime).toBe('2015-08-09');
        });

        it('should throw if a rubbish string is specified', function() {
            catalogItem.initialTimeSource = '2015z08-08';

            expect(function() {
                catalogItem.intervals = new TimeIntervalCollection([
                        new TimeInterval({
                            start: JulianDate.fromIso8601('2013-08-07T00:00:00.00Z'),
                            stop: JulianDate.fromIso8601('2115-08-09T00:00:00.00Z')
                        })
                ]);
            }).toThrow();
        });
    });

});