'use strict';

/*global require*/
var AnimationViewModel = require('../../lib/ViewModels/AnimationViewModel');
var Terria = require('../../lib/Models/Terria');
var ImageryLayerCatalogItem = require('../../lib/Models/ImageryLayerCatalogItem');
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var L = require('leaflet');
var TimeInterval = require('terriajs-cesium/Source/Core/TimeInterval');
var TimeIntervalCollection = require('terriajs-cesium/Source/Core/TimeIntervalCollection');
var dateFormat = require('dateformat');


describe('AnimationViewModel', function() {
    var terria, catalogItem;
    var animationVm;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        animationVm = new AnimationViewModel({
            terria: terria
        });
        animationVm.timeline = jasmine.createSpyObj('timeline', ['zoomTo', 'resize', '_makeTics']);

        catalogItem = new ImageryLayerCatalogItem(terria);
        catalogItem.clock = jasmine.createSpyObj('clock', ['getValue']);
    });

    it('on init, showAnimation should be false', function() {
        expect(animationVm.showAnimation).toBe(false);
    });

    describe('when a layer is added to the time series stack', function() {
        var LAYER_NAME = 'blahface';

        beforeEach(function() {
            catalogItem.name = LAYER_NAME;

            terria.timeSeriesStack.addLayerToTop(catalogItem);
        });

        it('should set showAnimation to true', function() {
            expect(animationVm.showAnimation).toBe(true);
        });

        it('should set layerName to the name of the topmost layer', function() {
            expect(animationVm.layerName).toBe(LAYER_NAME);
        });
    });

    describe('when the last layer is removed from the time series stack', function() {
        beforeEach(function() {
            terria.timeSeriesStack.addLayerToTop(catalogItem);
            terria.timeSeriesStack.removeLayer(catalogItem);
        });

        it('should set showAnimation to false', function() {
            expect(animationVm.showAnimation).toBe(false);
        });
    });

    describe('timelineTic format', function() {
        it('should be used if provided', function() {
            catalogItem.dateFormat.timelineTic = 'mmm';
            terria.timeSeriesStack.addLayerToTop(catalogItem);
            expect(animationVm.timeline.makeLabel(JulianDate.fromIso8601('2016-01-01'))).toBe('Jan');
        });

        it('should not be used if not provided', function() {
            terria.timeSeriesStack.addLayerToTop(catalogItem);
            expect(animationVm.timeline.makeLabel(JulianDate.fromIso8601('2016-01-01'))).toBe('01/01/2016, 00:00:00');
        });
    });

    describe('currentTime format', function() {
        it('should be used if provided', function() {
            catalogItem.dateFormat.currentTime = 'mmm';
            terria.timeSeriesStack.addLayerToTop(catalogItem);
            terria.clock.currentTime = JulianDate.fromIso8601('2016-01-01');
            terria.clock.onTick.raiseEvent(terria.clock);
            expect(animationVm.currentTimeString).toBe('Jan');
        });

        it('should not be used if not provided', function() {
            terria.timeSeriesStack.addLayerToTop(catalogItem);
            terria.clock.currentTime = JulianDate.fromIso8601('2016-01-01');
            terria.clock.onTick.raiseEvent(terria.clock);
            expect(animationVm.currentTimeString).toBe('01/01/2016, 00:00:00');
        });
    });

    describe('scrubbing', function() {
        var timelineContainer;

        beforeEach(function() {
            terria.timeSeriesStack.addLayerToTop(catalogItem);

            timelineContainer = document.createElement('div');
            timelineContainer.className = 'animation-timeline';
            document.body.appendChild(timelineContainer);

            spyOn(L.DomEvent, 'disableClickPropagation');

            animationVm.setupTimeline();
        });

        afterEach(function() {
            document.body.removeChild(timelineContainer);
        });

        it('should set the current time to the time in the event', function() {
            expect(terria.clock.currentTime).not.toEqual(JulianDate.fromIso8601('2016-01-01'));

            setTime(JulianDate.fromIso8601('2016-01-01'));

            expect(terria.clock.currentTime).toEqual(JulianDate.fromIso8601('2016-01-01'));
        });

        describe('with gap between intervals', function() {
            beforeEach(function() {
                catalogItem.intervals = new TimeIntervalCollection([
                    new TimeInterval({
                        start: JulianDate.fromIso8601('2016-01-03'),
                        stop: JulianDate.fromIso8601('2016-01-08')
                    }),
                    new TimeInterval({
                        start: JulianDate.fromIso8601('2016-01-20'),
                        stop: JulianDate.fromIso8601('2016-01-24')
                    })
                ]);
                catalogItem.clock = undefined;
                terria.timeSeriesStack.addLayerToTop(catalogItem);
            });

            it('should set time to time within an interval as usual', function() {
                expect(terria.clock.currentTime).not.toEqual(JulianDate.fromIso8601('2016-01-04'));
                setTime(JulianDate.fromIso8601('2016-01-04'));
                expect(terria.clock.currentTime).toEqual(JulianDate.fromIso8601('2016-01-04'));
            });

            describe('should change a time to the previous interval\'s end', function() {
                it('just after the start', function() {
                    setTime(JulianDate.fromIso8601('2016-01-08T00:00:01'));
                    expect(terria.clock.currentTime).toEqual(JulianDate.fromIso8601('2016-01-08T00:00:00'));
                });

                it('just before the midpoint', function() {
                    setTime(JulianDate.fromIso8601('2016-01-13T23:59:59'));
                    expect(terria.clock.currentTime).toEqual(JulianDate.fromIso8601('2016-01-08T00:00:00'));
                });
            });

            describe('should change a time to the next interval\'s start', function() {
                it('just before the end', function() {
                    setTime(JulianDate.fromIso8601('2016-01-19T23:59:59'));
                    expect(terria.clock.currentTime).toEqual(JulianDate.fromIso8601('2016-01-20T00:00:00'));
                });

                it('at the exact midpoint', function() {
                    setTime(JulianDate.fromIso8601('2016-01-13T24:00:00'));
                    expect(terria.clock.currentTime).toEqual(JulianDate.fromIso8601('2016-01-20T00:00:00'));
                });
            });
        });

        function setTime(time) {
            var evt = document.createEvent('Event');
            evt.initEvent('settime', true, true);
            evt.timeJulian = time;
            evt.clock = terria.clock;
            animationVm.timeline._topDiv.dispatchEvent(evt);
        }
    });

    describe('time slider initial time as specified by initialTimeSource ', function() {
        // Future developers take note: some of these tests will stop working in August 3015.
        it('should be present if not provided', function() {
            terria.clock.startTime = JulianDate.fromIso8601('2015-08-07');
            terria.clock.stopTime = JulianDate.fromIso8601('3015-08-09');
            terria.clock.currentTime = JulianDate.fromIso8601('2016-01-01');
            terria.timeSeriesStack.addLayerToTop(catalogItem);
            terria.clock.onTick.raiseEvent(terria.clock);
            var dateNow = (new Date()).toISOString();
            var currentTime = JulianDate.toIso8601(terria.clock.currentTime, 3);
            // Do not compare time, because on some systems the second could have ticked over between getting the two times.
            dateNow = dateNow.substr(0, 10);
            currentTime = currentTime.substr(0, 10);
            expect(currentTime).toBe(dateNow);
        });

        it('should be start if "start" set', function() {
            terria.clock.startTime = JulianDate.fromIso8601('2015-08-07');
            terria.clock.stopTime = JulianDate.fromIso8601('2015-08-09');
            terria.clock.currentTime = JulianDate.fromIso8601('2015-08-08');
            catalogItem.initialTimeSource = 'start';
            terria.timeSeriesStack.addLayerToTop(catalogItem);
            terria.clock.onTick.raiseEvent(terria.clock);
            expect(animationVm.currentTimeString).toBe('07/08/2015, 00:00:00');
        });

        it('should be start if date specified is before range', function() {
            terria.clock.startTime = JulianDate.fromIso8601('2015-08-07');
            terria.clock.stopTime = JulianDate.fromIso8601('2015-08-09');
            terria.clock.currentTime = JulianDate.fromIso8601('2015-08-08');
            catalogItem.initialTimeSource = '2000-08-08';
            terria.timeSeriesStack.addLayerToTop(catalogItem);
            terria.clock.onTick.raiseEvent(terria.clock);
            expect(animationVm.currentTimeString).toBe('07/08/2015, 00:00:00');
        });

        it('should be current time if "present" set', function() {
            terria.clock.startTime = JulianDate.fromIso8601('2015-08-07');
            terria.clock.stopTime = JulianDate.fromIso8601('3015-08-09');
            terria.clock.currentTime = JulianDate.fromIso8601('2015-08-09');
            catalogItem.initialTimeSource = 'present';
            terria.timeSeriesStack.addLayerToTop(catalogItem);
            terria.clock.onTick.raiseEvent(terria.clock);
            var dateNow = (new Date()).toISOString();
            var currentTime = JulianDate.toIso8601(terria.clock.currentTime, 3);
            // Do not compare time, because on some systems the second could have ticked over between getting the two times.
            dateNow = dateNow.substr(0, 10);
            currentTime = currentTime.substr(0, 10);
            expect(currentTime).toBe(dateNow);
        });

        it('should be last time if "end" set', function() {
            terria.clock.startTime = JulianDate.fromIso8601('2015-08-07');
            terria.clock.stopTime = JulianDate.fromIso8601('2015-08-09');
            terria.clock.currentTime = JulianDate.fromIso8601('2015-08-08');
            catalogItem.initialTimeSource = 'end';
            terria.timeSeriesStack.addLayerToTop(catalogItem);
            terria.clock.onTick.raiseEvent(terria.clock);
            expect(animationVm.currentTimeString).toBe('09/08/2015, 00:00:00');
        });

        it('should be last time if date specified is after range', function() {
            terria.clock.startTime = JulianDate.fromIso8601('2015-08-07');
            terria.clock.stopTime = JulianDate.fromIso8601('2015-08-09');
            terria.clock.currentTime = JulianDate.fromIso8601('2015-08-08');
            catalogItem.initialTimeSource = '3015-08-08';
            terria.timeSeriesStack.addLayerToTop(catalogItem);
            terria.clock.onTick.raiseEvent(terria.clock);
            expect(animationVm.currentTimeString).toBe('09/08/2015, 00:00:00');
        });

        it('should be set to date specified if date is specified', function() {
            terria.clock.startTime = JulianDate.fromIso8601('2015-08-07');
            terria.clock.stopTime = JulianDate.fromIso8601('2015-08-11');
            terria.clock.currentTime = JulianDate.fromIso8601('2015-08-21');
            catalogItem.initialTimeSource = '2015-08-08';
            terria.timeSeriesStack.addLayerToTop(catalogItem);
            terria.clock.onTick.raiseEvent(terria.clock);
            expect(animationVm.currentTimeString).toBe('08/08/2015, 00:00:00');
        });

        it('should be set to start if date specified is before time range', function() {
            terria.clock.startTime = JulianDate.fromIso8601('2015-08-07');
            terria.clock.stopTime = JulianDate.fromIso8601('2015-08-09');
            terria.clock.currentTime = JulianDate.fromIso8601('2015-08-09');
            catalogItem.initialTimeSource = '2014-08-08';
            terria.timeSeriesStack.addLayerToTop(catalogItem);
            terria.clock.onTick.raiseEvent(terria.clock);
            expect(animationVm.currentTimeString).toBe('07/08/2015, 00:00:00');
        });

        it('should be set to end if date specified is after time range', function() {
            terria.clock.startTime = JulianDate.fromIso8601('2015-08-07');
            terria.clock.stopTime = JulianDate.fromIso8601('2015-08-09');
            terria.clock.currentTime = JulianDate.fromIso8601('2015-08-09');
            catalogItem.initialTimeSource = '2222-08-08';
            terria.timeSeriesStack.addLayerToTop(catalogItem);
            terria.clock.onTick.raiseEvent(terria.clock);
            expect(animationVm.currentTimeString).toBe('09/08/2015, 00:00:00');
        });

        it('should be set to present if a rubbish string is specified', function() {
            terria.clock.startTime = JulianDate.fromIso8601('2015-08-07');
            terria.clock.stopTime = JulianDate.fromIso8601('3015-08-09');
            terria.clock.currentTime = JulianDate.fromIso8601('2015-08-09');
            catalogItem.initialTimeSource = '201508-08';
            expect(function() { terria.timeSeriesStack.addLayerToTop(catalogItem); } ).toThrow();
            terria.clock.onTick.raiseEvent(terria.clock);
            var dateNow = (new Date()).toISOString();
            var currentTime = JulianDate.toIso8601(terria.clock.currentTime, 3);
            // Do not compare time, because on some systems the second could have ticked over between getting the two times.
            dateNow = dateNow.substr(0, 10);
            currentTime = currentTime.substr(0, 10);
            expect(currentTime).toBe(dateNow);
        });
    });
});
