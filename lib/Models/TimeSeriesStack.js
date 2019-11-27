"use strict";

/*global require*/

var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

/**
 * Manages a stack of all the time series layers currently being shown and makes sure the clock provided is always tracking
 * the highest one. When the top-most layer is disabled, the clock will track the next highest in the stack. Provides access
 * to the current top layer so that can be displayed to the user.
 *
 * @param clock The clock that should track the highest layer.
 * @constructor
 */
var TimeSeriesStack = function(clock) {
  this.clock = clock;

  this._layerStack = [];

  knockout.track(this, ["_layerStack"]);

  /**
   * The highest time-series layer, or undefined if there are no time series layers.
   */
  knockout.defineProperty(this, "topLayer", {
    get: function() {
      if (this._layerStack.length) {
        return this._layerStack[this._layerStack.length - 1];
      }
      return undefined;
    }
  });

  knockout.getObservable(this, "topLayer").subscribe(function(topLayer) {
    if (defined(topLayer)) {
      // If there's a top layer, make the clock track it.
      this.clock.setCatalogItem(this.topLayer);
    } else {
      // If there's no layers, stop the clock from running.
      this.clock.shouldAnimate = false;
    }
  }, this);
};

/**
 * Adds the supplied {@link CatalogItem} to the top of the stack. If the item is already in the stack, it will be moved
 * rather than added twice.
 *
 * @param {CatalogItem} item
 */
TimeSeriesStack.prototype.addLayerToTop = function(item) {
  var currentIndex = this._layerStack.indexOf(item);
  this._layerStack.push(item);
  if (currentIndex > -1) {
    this._layerStack.splice(currentIndex, 1);
  }
};

/**
 * Removes a layer from the stack, no matter what it's location. If the layer is currently at the top, the value of
 * {@link TimeSeriesStack#topLayer} will change.
 *
 * @param {CatalogItem} item;
 */
TimeSeriesStack.prototype.removeLayer = function(item) {
  var index = this._layerStack.indexOf(item);
  this._layerStack.splice(index, 1);
};

/**
 * Promotes the supplied {@link CatalogItem} to the top of the stack if it is already in the stack. If the item is not
 * already in the stack it wont be added.
 *
 * @param {CatalogItem} item
 */
TimeSeriesStack.prototype.promoteLayerToTop = function(item) {
  var currentIndex = this._layerStack.indexOf(item);
  if (currentIndex > -1) {
    this.addLayerToTop(item);
  }
};

module.exports = TimeSeriesStack;
