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
var Color = require('terriajs-cesium/Source/Core/Color');
var dateFormat = require('dateformat');

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

    this.timeline = undefined;

    knockout.track(this, ['showAnimation', 'isPlaying', 'isLooping', 'currentTimeString', 'fasterActive', 'slowerActive','gotoStartActive', 'layerName']);

    var that = this;
    this.terria.clock.onTick.addEventListener(function(clock) {
        var time = JulianDate.toDate(clock.currentTime);

        if (defined(that.terria.timeSeriesStack.topLayer) && defined(that.terria.timeSeriesStack.topLayer.dateFormat.currentTime)) {
            that.currentTimeString = dateFormat(time, that.terria.timeSeriesStack.topLayer.dateFormat.currentTime);
        } else {
            that.currentTimeString = formatDateTime(time, that.locale);
        }
    });

    knockout.getObservable(this.terria.timeSeriesStack, 'topLayer').subscribe(function(topLayer) {
        that.showAnimation = defined(topLayer);

        //default to playing and looping when shown unless told otherwise
        if (that.showAnimation && that.autoPlay) {
            that.terria.clock.tick();
            that.terria.clock.shouldAnimate = true;
        }
        that.terria.clock.clockRange = ClockRange.LOOP_STOP;

        that.isPlaying = that.terria.clock.shouldAnimate;
        that.isLooping = that.terria.clock.clockRange === ClockRange.LOOP_STOP;

            //set these in the html with ko?
        if (defined(this.mapElementsToDisplace)) {
            for (var e = 0; e < this.mapElementsToDisplace.length; e++) {
                var elem = document.getElementsByClassName(this.mapElementsToDisplace[e])[0];
                if (defined(elem)) {
/*  TODO: Figure out how to do with with the animation-displace style
                    if (showTimeline > 0) {
                        if (elem.className.indexOf(' animation-displace') < 0) {
                            elem.className += ' animation-displace';
                        }
                    } else {
                        elem.className = elem.className.replace(' animation-displace', '');
                    }
*/
                    if (this.showAnimation > 0) {
                        elem.style.marginBottom = '45px';
                    } else {
                        elem.style.marginBottom = '0px';
                    }
                }
            }
        }
        if (this.showAnimation) {
            that.layerName = topLayer.name;
            that.timeline.zoomTo(that.terria.clock.startTime, that.terria.clock.stopTime);
        }

        if (topLayer.intervals) {
            for (var i = 1; i < topLayer.intervals._intervals.length; i++) {
                var gapStart = topLayer.intervals._intervals[i - 1].stop;
                var gapEnd = topLayer.intervals._intervals[i].start;

                if (JulianDate.compare(gapEnd, gapStart) > 0) {
                    var range = that.timeline.addHighlightRange('rgba(0, 0, 0, 0.5)', 27, 0);
                    range.setRange(gapStart, gapEnd);
                }
            }
        }

        if (defined(topLayer.dateFormat.timelineTic)) {
            that.timeline.makeLabel = function(time) {
                return dateFormat(JulianDate.toDate(time), topLayer.dateFormat.timelineTic);
            };
        } else {
            that.timeline.makeLabel = function(time) {
                var totalDays = JulianDate.daysDifference(that.terria.clock.stopTime, that.terria.clock.startTime);

                if (totalDays > 14) {
                    return formatDate(JulianDate.toDate(time), that.locale);
                }
                else if (totalDays < 1) {
                    return formatTime(JulianDate.toDate(time), that.locale);
                }
                return formatDateTime(JulianDate.toDate(time), that.locale);
            };
        }

        that.timeline._makeTics.call(that.timeline);
    }, this);

    window.addEventListener('resize', function() {
        if (defined(that.timeline)) {
            that.timeline.resize();
        }
    }, false);
};

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

    timeline.scrubFunction = function(e) {
        var clock = e.clock;

        var gap = clock.determineGap(e.timeJulian);
        if (gap) {
            var leftGap = JulianDate.compare(e.timeJulian, gap.start);
            var rightGap = JulianDate.compare(gap.stop, e.timeJulian);

            clock.currentTime = leftGap < rightGap ? gap.start : gap.stop;
        } else {
            clock.currentTime = e.timeJulian;
        }

        clock.shouldAnimate = false;
        viewModel.isPlaying = false;
        viewModel.terria.currentViewer.notifyRepaintRequired();

        // Cesium has a bug where it doesn't keep _lastXPos up to date in some situations, make sure it thinks xPos has changed.
        // Without this the scrubber will get stuck in a gap with no data :(.
        viewModel.timeline._lastXPos = Number.MIN_VALUE;
        viewModel.timeline.updateFromClock();
    };

    timeline.addEventListener('settime', timeline.scrubFunction, false);
}

AnimationViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/Animation.html', 'utf8'), container, this);
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
    var result = new AnimationViewModel(options);
    result.show(options.container);
    setupTimeline(result);
    return result;
};

module.exports = AnimationViewModel;
