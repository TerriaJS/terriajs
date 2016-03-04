'use strict';

/*global require*/
var L = require('leaflet');

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');

var ClockRange = require('terriajs-cesium/Source/Core/ClockRange');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var Timeline = require('terriajs-cesium/Source/Widgets/Timeline/Timeline');

var loadView = require('../Core/loadView');

var svgGotoStart = require('../SvgPaths/svgGotoStart');
var svgPlay = require('../SvgPaths/svgPlay');
var svgPause = require('../SvgPaths/svgPause');
var svgSlower = require('../SvgPaths/svgSlower');
var svgFaster = require('../SvgPaths/svgFaster');
var svgLoop = require('../SvgPaths/svgLoop');

var AnimationViewModel = function(options) {
    if (!defined(options) || !defined(options.terria)) {
        throw new DeveloperError('options.terria is required.');
    }

    this.terria = options.terria;
    this.locale = options.locale;
    this.autoPlay = defaultValue(options.autoPlay, true);
    this.mapElementsToDisplace = options.mapElementsToDisplace;

    this.svgGotoStart = defaultValue(options.svgGotoStart, svgGotoStart);
    this.svgPlay = defaultValue(options.svgPlay, svgPlay);
    this.svgPause = defaultValue(options.svgPause, svgPause);
    this.svgSlower = defaultValue(options.svgSlower, svgSlower);
    this.svgFaster = defaultValue(options.svgFaster, svgFaster);
    this.svgLoop = defaultValue(options.svgLoop, svgLoop);

    this.showAnimation = false;
    this.isPlaying = false;
    this.isLooping = false;
    this.currentTimeString = '';

    this.fasterActive = false;
    this.slowerActive = false;
    this.gotoStartActive = false;

    this.layerName = undefined;
    this.timeline = undefined;

    updateForNewTopLayer(this);

    knockout.track(this, ['showAnimation', 'isPlaying', 'isLooping', 'currentTimeString', 'fasterActive', 'slowerActive', 'gotoStartActive', 'layerName']);

    var that = this;
    this.terria.clock.onTick.addEventListener(function(clock) {
        var time = clock.currentTime;
        that.currentTimeString = formatDateTime(JulianDate.toDate(time), that.locale);
    });

    knockout.getObservable(this.terria.timeSeriesStack, 'topLayer').subscribe(function() {
        updateForNewTopLayer(this);
    }, this);

    window.addEventListener('resize', function() {
        if (defined(that.timeline)) {
            that.timeline.resize();
        }
    }, false);
};

function updateForNewTopLayer(animationViewModel) {
    var terria = animationViewModel.terria;
    animationViewModel.showAnimation = defined(terria.timeSeriesStack.topLayer);

    //default to playing and looping when shown unless told otherwise
    if (animationViewModel.showAnimation && animationViewModel.autoPlay) {
        terria.clock.tick();
        terria.clock.shouldAnimate = true;
    }
    terria.clock.clockRange = ClockRange.LOOP_STOP;

    animationViewModel.isPlaying = terria.clock.shouldAnimate;
    animationViewModel.isLooping = terria.clock.clockRange === ClockRange.LOOP_STOP;

    // Set these in the html with ko?
    if (defined(animationViewModel.mapElementsToDisplace)) {
        for (var e = 0; e < animationViewModel.mapElementsToDisplace.length; e++) {
            var elem = document.getElementsByClassName(animationViewModel.mapElementsToDisplace[e])[0];
            if (defined(elem)) {
/*              TODO: Figure out how to do with with the animation-displace style
                if (showTimeline > 0) {
                    if (elem.className.indexOf(' animation-displace') < 0) {
                        elem.className += ' animation-displace';
                    }
                } else {
                    elem.className = elem.className.replace(' animation-displace', '');
                }
*/
                if (animationViewModel.showAnimation > 0) {
                    elem.style.marginBottom = '45px';
                } else {
                    elem.style.marginBottom = '0px';
                }
            }
        }
    }
    if (animationViewModel.showAnimation) {
        animationViewModel.layerName = terria.timeSeriesStack.topLayer.name;
        if (defined(animationViewModel.timeline)) {
            animationViewModel.timeline.zoomTo(terria.clock.startTime, terria.clock.stopTime);
        }
    }
}

function formatDate(d, locale) {
    function pad(s) { return (s < 10) ? '0' + s : s; }
    if (defined(locale)) {
        return d.toLocaleDateString(locale);
    }
    return [pad(d.getDate()), pad(d.getMonth()+1), d.getFullYear()].join('/');
}

function formatTime(d, locale) {
    function pad(s) { return (s < 10) ? '0' + s : s; }
    if (defined(locale)) {
        return d.toLocaleTimeString(locale);
    }
    return [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':');
}

function formatDateTime(d, locale) {
    return formatDate(d, locale) + ', ' + formatTime(d, locale);
}


function setupTimeline(viewModel) {
    var timelineContainer = document.getElementsByClassName('animation-timeline')[0];
    var controlsContainer = document.getElementsByClassName('animation-controls')[0];

    L.DomEvent.disableClickPropagation(timelineContainer);
    L.DomEvent.disableClickPropagation(controlsContainer);

    var timeline = new Timeline(timelineContainer, viewModel.terria.clock);
    viewModel.timeline = timeline;

    timeline.makeLabel = function(time) {
        var totalDays = JulianDate.daysDifference(viewModel.terria.clock.stopTime, viewModel.terria.clock.startTime);
        if (totalDays > 14) {
            return formatDate(JulianDate.toDate(time), viewModel.locale);
        }
        else if (totalDays < 1) {
            return formatTime(JulianDate.toDate(time), viewModel.locale);
        }
        return formatDateTime(JulianDate.toDate(time), viewModel.locale);
    };

    timeline.scrubFunction = function(e) {
        var clock = e.clock;
        clock.currentTime = e.timeJulian;
        clock.shouldAnimate = false;
        viewModel.isPlaying = false;
        viewModel.terria.currentViewer.notifyRepaintRequired();
    };

    timeline.addEventListener('settime', timeline.scrubFunction, false);
    viewModel.timeline.zoomTo(viewModel.terria.clock.startTime, viewModel.terria.clock.stopTime);
}

AnimationViewModel.prototype.show = function(container) {
    loadView(require('../Views/Animation.html'), container, this);
};

AnimationViewModel.prototype.gotoStart = function() {
    this.terria.analytics.logEvent('navigation', 'click', 'gotoStart');

    this.terria.clock.currentTime = this.terria.clock.startTime;

    this.terria.currentViewer.notifyRepaintRequired();
};

AnimationViewModel.prototype.togglePlay = function() {
    this.terria.analytics.logEvent('navigation', 'click', 'togglePlay');

    this.terria.clock.tick();
    if (this.terria.clock.multiplier < 0) {
        this.terria.clock.multiplier = -this.terria.clock.multiplier;
    }
    this.terria.clock.shouldAnimate = !this.terria.clock.shouldAnimate;
    this.isPlaying = this.terria.clock.shouldAnimate;

    this.terria.currentViewer.notifyRepaintRequired();
};

AnimationViewModel.prototype.playSlower = function() {
    this.terria.analytics.logEvent('navigation', 'click', 'playSlower');

    this.terria.clock.tick();
    this.terria.clock.multiplier /= 2;
    this.terria.clock.shouldAnimate = true;
    this.isPlaying = true;

    this.terria.currentViewer.notifyRepaintRequired();
};

AnimationViewModel.prototype.playFaster = function() {
    this.terria.analytics.logEvent('navigation', 'click', 'playFaster');

    this.terria.clock.tick();
    this.terria.clock.multiplier *= 2;
    this.terria.clock.shouldAnimate = true;
    this.isPlaying = true;

    this.terria.currentViewer.notifyRepaintRequired();
};

AnimationViewModel.prototype.toggleLoop = function() {
    this.terria.analytics.logEvent('navigation', 'click', 'toggleLoop');

    this.isLooping = !this.isLooping;
    if (this.isLooping) {
        this.terria.clock.clockRange = ClockRange.LOOP_STOP;
    } else {
        this.terria.clock.clockRange = ClockRange.UNBOUNDED;
    }

    if ((JulianDate.greaterThan(this.terria.clock.startTime, this.terria.clock.currentTime)) ||
        (JulianDate.lessThan(this.terria.clock.stopTime, this.terria.clock.currentTime))) {
        this.terria.clock.currentTime = this.terria.clock.startTime;
    }
};

AnimationViewModel.create = function(options) {
    // Creates the viewmodel, sets up the timeline and shows the view.
    var result = new AnimationViewModel(options);
    result.show(options.container);
    setupTimeline(result);
    return result;
};

module.exports = AnimationViewModel;
