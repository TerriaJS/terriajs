'use strict';

/*global require*/
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var SearchResultViewModel = function(options) {
    this.name = defaultValue(options.name, 'Unknown');
    this.tooltip = options.tooltip;
    this.isImportant = defaultValue(options.isImportant, false);
    this.clickAction = options.clickAction;

    knockout.track(this, ['name', 'tooltip', 'clickAction']);
};

module.exports = SearchResultViewModel;
