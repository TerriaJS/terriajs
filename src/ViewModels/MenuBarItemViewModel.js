'use strict';

/*global require*/
var defined = require('../../third_party/cesium/Source/Core/defined');

var MenuBarItemViewModel = function(options) {
    this.label = options.label;
    this.image = options.image;
    this.imageWidth = options.imageWidth;
    this.imageHeight = options.imageHeight;
    this.tooltip = options.tooltip;
    this.callback = options.callback;
    this.href = options.href;
};

MenuBarItemViewModel.prototype.execute = function() {
    if (defined(this.callback)) {
        this.callback(this);
    }
};

module.exports = MenuBarItemViewModel;
