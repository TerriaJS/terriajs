'use strict';

/*global require,ga*/
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');

var loadView = require('../Core/loadView');

var svgReset = require('../SvgPaths/svgReset');


var AnimationViewModel = function(options) {
    if (!defined(options) || !defined(options.terria)) {
        throw new DeveloperError('options.terria is required.');
    }

    this.terria = options.terria;

    this.svgReset = svgReset;
};

AnimationViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/Animation.html', 'utf8'), container, this);
};

AnimationViewModel.prototype.fasterForward = function() {
    ga('send', 'event', 'navigation', 'click', 'faster');

    if (this.terria.clock.multiplier > 0) {
        this.terria.clock.multiplier *= 2;
    } else {
        this.terria.clock.multiplier /= 2;
    }
};

AnimationViewModel.prototype.fasterBackward = function() {
    ga('send', 'event', 'navigation', 'click', 'slower');

    if (this.terria.clock.multiplier < 0) {
        this.terria.clock.multiplier *= 2;
    } else {
        this.terria.clock.multiplier /= 2;
    }
};

AnimationViewModel.prototype.forward = function() {
    ga('send', 'event', 'navigation', 'click', 'forward');

    if (this.terria.clock.multiplier < 0) {
        this.terria.clock.multiplier = -this.terria.clock.multiplier;
    }
    this.terria.clock.shouldAnimate = !this.terria.clock.shouldAnimate;
};

AnimationViewModel.prototype.backward = function() {
    ga('send', 'event', 'navigation', 'click', 'forward');

    if (this.terria.clock.multiplier > 0) {
        this.terria.clock.multiplier = -this.terria.clock.multiplier;
    }
    this.terria.clock.shouldAnimate = !this.terria.clock.shouldAnimate;
};


AnimationViewModel.create = function(options) {
    var result = new AnimationViewModel(options);
    result.show(options.container);
    return result;
};

module.exports = AnimationViewModel;
