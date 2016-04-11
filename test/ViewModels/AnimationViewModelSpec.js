'use strict';

/*global require*/
var AnimationViewModel = require('../../lib/ViewModels/AnimationViewModel');
var Terria = require('../../lib/Models/Terria');
var ImageryLayerCatalogItem = require('../../lib/Models/ImageryLayerCatalogItem');
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var L = require('leaflet');
var TimeInterval = require('terriajs-cesium/Source/Core/TimeInterval');
var TimeIntervalCollection = require('terriajs-cesium/Source/Core/TimeIntervalCollection');

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
});
