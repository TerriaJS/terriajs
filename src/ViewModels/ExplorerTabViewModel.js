'use strict';

/*global require*/
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var ExplorerTabViewModel = function(name) {
    this.panel = undefined;
    this.name = defaultValue(name, 'Unknown');
    this.isVisible = true;
    this.isActive = false;

    knockout.track(this, ['name', 'isVisible', 'isActive']);
};

ExplorerTabViewModel.prototype.activate = function() {
    if (defined(this.panel)) {
        this.panel.activateTab(this);
    } else {
        this.isActive = true;
    }
};

module.exports = ExplorerTabViewModel;
