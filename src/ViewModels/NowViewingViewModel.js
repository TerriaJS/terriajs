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

    /**
     * Gets or sets a value indicating whether the Now Viewing list is currently open and visible.
     * @type {Boolean}
     */
    this.isOpen = true;

    knockout.track(this, ['items', 'isOpen']);
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
 * Removes an item from the "Now Viewing" pane and from the map.
 *
 * @param {GeoDataItemViewModel} item The item to remove.
 */
NowViewingViewModel.prototype.remove = function(item) {
    item.isEnabled = false;

    // This is likely to be a no-op, because setting isEnabled=false already removed it.
    this.items.remove(item);
};

/**
 * Removes all data sources from the "Now Viewing" pane and from the map.
 */
NowViewingViewModel.prototype.removeAll = function() {
    // Work backwards through the list of items because setting isEnabled=false
    // will usually remove the item from the list.
    for (var i = this.items.length - 1; i >= 0; --i) {
        this.items[i].isEnabled = false;
    }

    this.items.removeAll();
};

/**
 * Raises an item, making it displayed on top of the item that is currently above it.  If it
 * is nonsensical to move this item up (e.g. it is already at the top), this method does nothing.
 *
 * @param {GeoDataItemViewModel} item The item to raise.
 */
NowViewingViewModel.prototype.raise = function(item) {
    var index = this.items.indexOf(item);
    if (index <= 0) {
        return;
    }

    this.items.splice(index, 1);
    this.items.splice(index - 1, 0, item);
};

/**
 * Lowers an item, making it displayed below the item that is currently below it.  If it
 * is nonsensical to move this item down (e.g. it is already at the bottom), this method does nothing.
 *
 * @param {GeoDataItemViewModel} item The item to lower.
 */
NowViewingViewModel.prototype.lower = function(item) {
    var index = this.items.indexOf(item);
    if (index < 0 || index === this.items.length - 1) {
        return;
    }

    this.items.splice(index, 1);
    this.items.splice(index + 1, 0, item);
};

/**
 * Toggles the {@link NowViewingViewModel#isOpen} flag.  If it's open, it is closed.  If it's closed, it is opened.
 */
NowViewingViewModel.prototype.toggleOpen = function() {
    this.isOpen = !this.isOpen;
};

module.exports = NowViewingViewModel;