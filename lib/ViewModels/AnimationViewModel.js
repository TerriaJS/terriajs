'use strict';

/*global require,ga*/
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var Timeline = require('terriajs-cesium/Source/Widgets/Timeline/Timeline');

var loadView = require('../Core/loadView');
var svgReset = require('../SvgPaths/svgReset');


var AnimationViewModel = function(options) {
    if (!defined(options) || !defined(options.terria)) {
        throw new DeveloperError('options.terria is required.');
    }

    this.terria = options.terria;

    this.svgReset = svgReset;

    this.showAnimation = false;
    this.isMovingForward = false;
    this.isMovingBackward = false;
    this.currentTimeString = 'undefined';

    this.timeline = undefined;

    knockout.track(this, ['showAnimation', 'isMovingForward', 'isMovingBackward', 'currentTimeString']);

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
        viewModel.terria.currentViewer.notifyRepaintRequired();
    };
    timeline.addEventListener('settime', timeline.scrubFunction, false);
}

AnimationViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/Animation.html', 'utf8'), container, this);
};

AnimationViewModel.prototype.faster = function() {
    ga('send', 'event', 'navigation', 'click', 'faster');

    this.terria.clock.multiplier *= 2;

    this.terria.currentViewer.notifyRepaintRequired();
};

AnimationViewModel.prototype.slower = function() {
    ga('send', 'event', 'navigation', 'click', 'slower');

    this.terria.clock.multiplier /= 2;
    
    this.terria.currentViewer.notifyRepaintRequired();
};

AnimationViewModel.prototype.pause = function() {
    ga('send', 'event', 'navigation', 'click', 'forward');

    this.terria.clock.shouldAnimate = false;
    this.isMovingForward = false;
    this.isMovingBackward = false;

    this.terria.currentViewer.notifyRepaintRequired();
};

AnimationViewModel.prototype.forward = function() {
    ga('send', 'event', 'navigation', 'click', 'forward');

    if (this.terria.clock.multiplier < 0) {
        this.terria.clock.multiplier = -this.terria.clock.multiplier;
    }        
    this.terria.clock.shouldAnimate = true;
    this.isMovingBackward = false;
    this.isMovingForward = true;

    this.terria.currentViewer.notifyRepaintRequired();
};

AnimationViewModel.prototype.backward = function() {
    ga('send', 'event', 'navigation', 'click', 'forward');

    if (this.terria.clock.multiplier > 0) {
        this.terria.clock.multiplier = -this.terria.clock.multiplier;
    }
    this.terria.clock.shouldAnimate = true;
    this.isMovingBackward = true;
    this.isMovingForward = false;

    this.terria.currentViewer.notifyRepaintRequired();
};


AnimationViewModel.create = function(options) {
    var result = new AnimationViewModel(options);
    result.show(options.container);
    setupTimeline(result);
    return result;
};

module.exports = AnimationViewModel;
