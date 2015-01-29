'use strict';

/*global require*/
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var loadView = require('../Core/loadView');
var ViewerMode = require('../Models/ViewerMode');

var SettingsPanelViewModel = function(options) {
    if (!defined(options) || !defined(options.application)) {
        throw new DeveloperError('options.application is required.');
    }

    this.application = options.application;

    this._domNodes = undefined;

    this.isVisible = defaultValue(options.isVisible, true);
    this.baseMaps = [];
    this.mouseOverBaseMap = undefined;

    knockout.track(this, ['isVisible', 'baseMaps', 'mouseOverBaseMap']);
};

SettingsPanelViewModel.prototype.show = function(container) {
    if (!defined(this._domNodes)) {
        this._domNodes = loadView(require('fs').readFileSync(__dirname + '/../Views/SettingsPanel.html', 'utf8'), container, this);
    }
};

SettingsPanelViewModel.prototype.close = function() {
    this.isVisible = false;
};

SettingsPanelViewModel.prototype.closeIfClickOnBackground = function(viewModel, e) {
    if (e.target.className === 'settings-panel-background') {
        this.close();
    }
    return true;
};

SettingsPanelViewModel.prototype.select2D = function() {
    this.application.viewerMode = ViewerMode.Leaflet;
};

SettingsPanelViewModel.prototype.select3DSmooth = function() {
    this.application.viewerMode = ViewerMode.CesiumEllipsoid;
};

SettingsPanelViewModel.prototype.select3DTerrain = function() {
    this.application.viewerMode = ViewerMode.CesiumTerrain;
};

SettingsPanelViewModel.prototype.changeHighlightedBaseMap = function(baseMap) {
    this.mouseOverBaseMap = baseMap;
};

SettingsPanelViewModel.prototype.selectBaseMap = function(baseMap) {
    this.application.baseMap = baseMap.catalogItem;
};

SettingsPanelViewModel.prototype.resetHightedBaseMap = function() {
    this.mouseOverBaseMap = undefined;
};

module.exports = SettingsPanelViewModel;