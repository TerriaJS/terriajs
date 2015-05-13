'use strict';

/*global require,ga*/
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var loadView = require('../Core/loadView');

var svgReset = require('../SvgPaths/svgReset');


var AnimationViewModel = function(options) {
    if (!defined(options) || !defined(options.terria)) {
        throw new DeveloperError('options.terria is required.');
    }

    this.terria = options.terria;

    this.svgReset = svgReset;

    this.showAnimation = true;
    this.isMovingForward = false;
    this.isMovingBackward = false;
    this.currentTimeString = 'undefined'

    knockout.track(this, ['showAnimation', 'isMovingForward', 'isMovingBackward', 'currentTimeString']);

    var that = this;
    this.terria.clock.onTick.addEventListener(function(clock) {
        var time = clock.currentTime;
        that.currentTimeString = JulianDate.toDate(time).toLocaleString();
   });
};

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
    return result;
};

module.exports = AnimationViewModel;
