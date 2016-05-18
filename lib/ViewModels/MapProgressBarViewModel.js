'use strict';

/*global require*/
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadView = require('../Core/loadView');
var EventHelper = require('terriajs-cesium/Source/Core/EventHelper');

/**
 * A simple progress bar that adjusts its width based on the current number of tiles being loaded by Cesium or Leaflet.
 * Will automatically react to viewer changes (Cesium -> Leaflet and vice versa) without the need to re-initialise.
 *
 * @param options.terria {Terria} the terria instance to track
 * @constructor
 */
var MapProgressBarViewModel = function(options) {
    this.terria = options.terria;
    this._eventHelper = new EventHelper();

    this._eventHelper.add(this.terria.tileLoadProgressEvent, this._setProgress.bind(this));

    // Clear progress when the viewer changes so we're not left with an invalid progress bar hanging on the screen.
    this._eventHelper.add(this.terria.beforeViewerChanged, this._setProgress.bind(this, 0, 0));

    // 100% loaded = view invisible.
    this.percentage = 100;
    knockout.track(this, ['percentage']);
};

/**
 * Updates this view with the current progress. Rather than receive a fraction or percentage of how much has been
 * loaded, this receives the raw information of how many tiles are waiting to be loaded, and the total tiles that have
 * to be loaded (this includes the value in remaining).
 *
 * @param remaining The number of tiles remaining to be loaded
 * @param total The total number of tiles, including those that have been loaded and are still waiting to be loaded.
 */
MapProgressBarViewModel.prototype._setProgress = function(remaining, max) {
    var percentage = (1 - (remaining / max)) * 100;
    this.percentage = Math.floor(remaining > 0 ? percentage : 100);
};

MapProgressBarViewModel.prototype.show = function(container) {
    loadView(require('../Views/MapProgressBar.html'), container, this);
};

MapProgressBarViewModel.create = function(options) {
    var viewModel = new MapProgressBarViewModel(options);
    viewModel.show(options.container);
    return viewModel;
};

module.exports = MapProgressBarViewModel;
