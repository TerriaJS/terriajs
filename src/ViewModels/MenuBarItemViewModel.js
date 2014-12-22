'use strict';

/*global require*/
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var MenuBarItemViewModel = function(options) {
    this.label = options.label;
    this.image = options.image;
    this.imageWidth = options.imageWidth;
    this.imageHeight = options.imageHeight;
    this.tooltip = options.tooltip;
    this.callback = options.callback;
    this.href = options.href;
    this.visible = defaultValue(options.visible, true);

    knockout.track(this, ['label', 'image', 'imageWidth', 'imageHeight', 'tooltip', 'href', 'visible']);
};

MenuBarItemViewModel.prototype.execute = function() {
    if (defined(this.callback)) {
        this.callback(this);
    }
};

module.exports = MenuBarItemViewModel;
