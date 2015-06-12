'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var loadView = require('../Core/loadView');

var NowViewingAttentionGrabberViewModel = function(options) {
    if (!defined(options) || !defined(options.terria)) {
        throw new DeveloperError('options.terria is required');
    }

    this.terria = options.terria;
    this.isVisible = defaultValue(options.isVisible, false);
    this.onlyShowOnceAcrossSessions = defaultValue(options.onlyShowOnceAcrossSessions, true);
    this.nowViewingTabViewModel = options.nowViewingTabViewModel;

    var defaultShownBeforeValue = false;
    if (this.onlyShowOnceAcrossSessions && typeof localStorage !== 'undefined') {
        if (localStorage.getItem(localStorageShownBeforeKey(this)) !== null) {
            defaultShownBeforeValue = localStorage.getItem(localStorageShownBeforeKey(this)) === 'true';
        }
    }

    this.shownBefore = defaultValue(options.showBefore, defaultShownBeforeValue);

    knockout.track(this, ['isVisible']);

    knockout.getObservable(this.terria.nowViewing, 'items').subscribe(function() {
        if (!this.shownBefore && this.terria.nowViewing.items.length > 0) {
            this.isVisible = true;
        }
    }, this);

    // Hide the info when the Now Viewing tab is selected.
    if (defined(this.nowViewingTabViewModel)) {
        knockout.getObservable(this.nowViewingTabViewModel, 'isActive').subscribe(function() {
            this.close();
        }, this);
    }
};

NowViewingAttentionGrabberViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/NowViewingAttentionGrabber.html', 'utf8'), container, this);
};

NowViewingAttentionGrabberViewModel.prototype.close = function() {
    this.shownBefore = true;
    this.isVisible = false;

    if (this.onlyShowOnceAcrossSessions && typeof localStorage !== 'undefined') {
        localStorage.setItem(localStorageShownBeforeKey(this), true);
    }
};

NowViewingAttentionGrabberViewModel.create = function(options) {
    var result = new NowViewingAttentionGrabberViewModel(options);
    result.show(options.container);
    return result;
};

function localStorageShownBeforeKey(viewModel) {
    return viewModel.terria.appName + '.NowViewingAttentionGrabberViewModel.shownBefore';
}

module.exports = NowViewingAttentionGrabberViewModel;
