'use strict';

/*global require*/
var defined = require('../../third_party/cesium/Source/Core/defined');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var OnePanelOpenInTopRight = function() {
    this._panels = [];
};

OnePanelOpenInTopRight.prototype.addPanel = function(panelViewModel) {
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

OnePanelOpenInTopRight.prototype.hideAllExcept = function(panelViewModelToKeep) {
    for (var i = 0; i < this._panels.length; ++i) {
        if (this._panels[i] !== panelViewModelToKeep) {
            this._panels[i].isVisible = false;
        }
    }
};

module.exports = OnePanelOpenInTopRight;