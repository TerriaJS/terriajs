'use strict';

/*global require,ga*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');

var ClockRange = require('terriajs-cesium/Source/Core/ClockRange');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var Timeline = require('terriajs-cesium/Source/Widgets/Timeline/Timeline');

var loadView = require('../Core/loadView');

var svgPlay = require('../SvgPaths/svgPlay');
var svgPause = require('../SvgPaths/svgPause');
var svgLoop = require('../SvgPaths/svgLoop');
var svgSlower = require('../SvgPaths/svgSlower');
var svgFaster = require('../SvgPaths/svgFaster');

var AnimationViewModel = function(options) {
    if (!defined(options) || !defined(options.terria)) {
        throw new DeveloperError('options.terria is required.');
    }

    this.terria = options.terria;

    this.svgPlay = defaultValue(options.svgPlay, svgPlay);
    this.svgPause = defaultValue(options.svgPause, svgPause);
    this.svgLoop = defaultValue(options.svgLoop, svgLoop);
    this.svgSlower = defaultValue(options.svgSlower, svgSlower);
    this.svgFaster = defaultValue(options.svgFaster, svgFaster);

    this.showAnimation = false;
    this.isPlaying = false;
    this.isLooping = this.terria.clock.clockRange === ClockRange.LOOP_STOP;
    this.currentTimeString = 'undefined';

    this.highlight = false;

    this.timeline = undefined;

    knockout.track(this, ['showAnimation', 'isPlaying', 'isLooping', 'currentTimeString', 'highlight']);

    var that = this;
    this.terria.clock.onTick.addEventListener(function(clock) {
        var time = clock.currentTime;
        that.currentTimeString = JulianDate.toDate(time).toLocaleString();
    });

    knockout.getObservable(this.terria, 'showTimeline').subscribe(function(showTimeline) {
        that.showAnimation = (showTimeline > 0);
            //set these in the html with ko?
        var creditsElem =document.getElementsByClassName('cesium-widget-credits')[0];
        var distLegendElem = document.getElementsByClassName('distance-legend')[0];
        var locationElem = document.getElementsByClassName('location-bar')[0];
        if (showTimeline === 0) {
            if (defined(that.terria.cesium)) {
                creditsElem.style.bottom = '0px';
                creditsElem.style.left = '0px';
                distLegendElem.style.bottom = '30px';
                locationElem.style.bottom = '30px';
            }
        }
        else if (defined(that.terria.cesium)) {
            creditsElem.style.bottom = '26px';
            creditsElem.style.left = '168px';
            distLegendElem.style.bottom = '55px';
            locationElem.style.bottom = '55px';
            that.timeline.zoomTo( that.terria.clock.startTime, that.terria.clock.stopTime);
        }
        else {
            that.timeline.zoomTo( that.terria.clock.startTime, that.terria.clock.stopTime);
        }
    }, this);
};

function setupTimeline(viewModel) {
    var timelineContainer = document.getElementsByClassName('animation-timeline')[0];
    var timeline = new Timeline(timelineContainer, viewModel.terria.clock);
    viewModel.timeline = timeline;

    timeline.makeLabel = function(time) {

        var totalDays = JulianDate.daysDifference(viewModel.terria.clock.stopTime, viewModel.terria.clock.startTime);

        if (totalDays > 14) {
            return JulianDate.toDate(time).toLocaleDateString();
        }
        else if (totalDays < 1) {
            return JulianDate.toDate(time).toLocaleTimeString();
        }
        return JulianDate.toDate(time).toLocaleString();
    };

    timeline.scrubFunction = function(e) {
        var leaflet = viewModel.terria.leaflet;
        if (defined(leaflet) && defined(leaflet.map) && leaflet.map.dragging.enabled()) {
            leaflet.map.dragging.disable();
            leaflet.map.on('mouseup', function(e) {
                leaflet.map.dragging.enable();
            });
        }
        var clock = e.clock;
        clock.currentTime = e.timeJulian;
        clock.shouldAnimate = false;
        viewModel.isPlaying = false;
        viewModel.terria.currentViewer.notifyRepaintRequired();
    };
    timeline.addEventListener('settime', timeline.scrubFunction, false);
}

AnimationViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/Animation.html', 'utf8'), container, this);
};

AnimationViewModel.prototype.down = function() {
    this.highlight = true;
};

AnimationViewModel.prototype.up = function() {
    this.highlight = false;
};

AnimationViewModel.prototype.playSlower = function() {
    ga('send', 'event', 'navigation', 'click', 'playSlower');

    this.terria.clock.multiplier /= 2;
    
    this.terria.currentViewer.notifyRepaintRequired();
};

AnimationViewModel.prototype.togglePlay = function() {
    ga('send', 'event', 'navigation', 'click', 'togglePlay');

    if (this.terria.clock.multiplier < 0) {
        this.terria.clock.multiplier = -this.terria.clock.multiplier;
    }        
    this.terria.clock.shouldAnimate = !this.terria.clock.shouldAnimate;
    this.isPlaying = this.terria.clock.shouldAnimate;

    this.terria.currentViewer.notifyRepaintRequired();
};

AnimationViewModel.prototype.playFaster = function() {
    ga('send', 'event', 'navigation', 'click', 'playFaster');

    this.terria.clock.multiplier *= 2;

    this.terria.currentViewer.notifyRepaintRequired();
};

AnimationViewModel.prototype.toggleLoop = function() {
    ga('send', 'event', 'navigation', 'click', 'toggleLoop');

    this.isLooping = !this.isLooping;
    if (this.isLooping) {
        this.terria.clock.clockRange = ClockRange.LOOP_STOP;
    } else {
        this.terria.clock.clockRange = ClockRange.UNBOUNDED;
    }
};

AnimationViewModel.create = function(options) {
    var result = new AnimationViewModel(options);
    result.show(options.container);
    setupTimeline(result);
    return result;
};

module.exports = AnimationViewModel;
