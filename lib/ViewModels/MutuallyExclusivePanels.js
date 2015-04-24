'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var MutuallyExclusivePanels = function(options) {
    this._panels = [];

    if (defined(options) && defined(options.panels)) {
        for (var i = 0; i < options.panels.length; ++i) {
            this.addPanel(options.panels[i]);
        }
    }
};

MutuallyExclusivePanels.prototype.addPanel = function(panelViewModel) {
    var isVisibleProperty = knockout.getObservable(panelViewModel, 'isVisible');
    if (!defined(isVisibleProperty)) {
        throw new DeveloperError('panelViewModel must have an observable isVisible property');
    }

    this._panels.push(panelViewModel);

    isVisibleProperty.subscribe(function(value) {
        if (value) {
            this.hideAllExcept(panelViewModel);
        }
    }, this);
};

MutuallyExclusivePanels.prototype.hideAllExcept = function(panelViewModelToKeep) {
    for (var i = 0; i < this._panels.length; ++i) {
        if (this._panels[i] !== panelViewModelToKeep) {
            this._panels[i].isVisible = false;
        }
    }
};

MutuallyExclusivePanels.create = function(options) {
    return new MutuallyExclusivePanels(options);
};

module.exports = MutuallyExclusivePanels;