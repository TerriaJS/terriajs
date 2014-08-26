'use strict';

/*global require*/

var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

/**
 * The view-model for the "Now Viewing" pane.
 */
var NowViewingViewModel = function() {
    /**
     * Gets the list of items that we are "now viewing".  It is recommended that you use
     * the methods on this instance instead of manipulating the list of items directly.
     * This property is observable.
     * @type {GeoDataItemViewModel[]}
     */
    this.items = [];

    knockout.track(this, ['items']);
};

defineProperties(NowViewingViewModel.prototype, {
    /**
     * Gets a value indicating whether the "Now Viewing" pane has one or more items.
     * @type {Boolean}
     */
    hasItems : {
        get : function() {
            return this.items.length > 0;
        }
    }
});

/**
 * Adds an item to the "Now Viewing" pane.
 *
 * @param {GeoDataItemViewModel} item The item to add.
 */
NowViewingViewModel.prototype.add = function(item) {
    // TODO: maintain sensible order.
    this.items.unshift(item);
};

/**
 * Removes an item from the "Now Viewing" pane.
 *
 * @param {GeoDataItemViewModel} item The item to remove.
 */
NowViewingViewModel.prototype.remove = function(item) {
    this.items.remove(item);
};

/**
 * Raises an item, making it displayed on top of the item that is currently above it.  If it
 * is nonsensical to move this item up (e.g. it is already at the top), this method does nothing.
 *
 * @param {GeoDataItemViewModel} item The item to raise.
 */
NowViewingViewModel.prototype.raise = function(item) {
    // TODO
};

/**
 * Raises an item, making it displayed on top of the item that is currently above it.  If it
 * is nonsensical to move this item up (e.g. it is already at the top), this method does nothing.
 *
 * @param {GeoDataItemViewModel} item The item to raise.
 */
NowViewingViewModel.prototype.lower = function(item) {
    // TODO
};

module.exports = NowViewingViewModel;