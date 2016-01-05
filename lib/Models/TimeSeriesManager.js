"use strict";

/*global require*/

var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var defined = require('terriajs-cesium/Source/Core/defined');

var TimeSeriesManager = function(clock) {
    this.clock = clock;

    this._layerStack = [];

    knockout.defineProperty(this, 'topLayer', {
        get: function () {
            if (this._layerStack.length) {
                return this._layerStack[this._layerStack.length - 1];
            }
        }
    });

    knockout.getObservable(this, 'topLayer').subscribe(function() {
        if (!defined(this.topLayer)) {
            this.clock.shouldAnimate = false;
        }

        this.topLayer.clock.getValue(this.clock);
    }.bind(this));
};

TimeSeriesManager.prototype.addLayerToTop = function(item) {
    var currentIndex = this._layerStack.indexOf(item);

    this._layerStack.push(item);

    if (currentIndex > -1) {
        this._layerStack.splice(currentIndex, 1);
    }
};

TimeSeriesManager.prototype.removeLayer = function(item) {
    var index = this._layerStack.indexOf(item);

    this._layerStack.splice(index, 1);
};

module.exports = TimeSeriesManager;
