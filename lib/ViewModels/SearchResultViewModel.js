'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var raiseErrorOnRejectedPromise = require('../Models/raiseErrorOnRejectedPromise');

var SearchResultViewModel = function(options) {
    this.name = defaultValue(options.name, 'Unknown');
    this.tooltip = options.tooltip;
    this.isImportant = defaultValue(options.isImportant, false);
    this.clickAction = options.clickAction;
    this.catalogItem = options.catalogItem;
    this.isOpen = false;

    knockout.track(this, ['name', 'tooltip', 'isImportant', 'clickAction', 'catalogItem', 'isOpen']);
};

SearchResultViewModel.prototype.toggleOpen = function() {
    if (!defined(this.catalogItem)) {
        return;
    }

    this.isOpen = !this.isOpen;

    // Load this group's items (if we haven't already) when it is opened.
    if (this.isOpen) {
        raiseErrorOnRejectedPromise(this.catalogItem.terria, this.catalogItem.load());
    }

};

module.exports = SearchResultViewModel;
