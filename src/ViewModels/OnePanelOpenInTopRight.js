'use strict';

/*global require*/
var defined = require('Cesium/Core/defined');
var DeveloperError = require('Cesium/Core/DeveloperError');
var knockout = require('Cesium/ThirdParty/knockout');

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