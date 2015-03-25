'use strict';

/*global require*/
var defined = require('../../third_party/cesium/Source/Core/defined');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var loadView = require('../Core/loadView');

var FeatureInfoPanelViewModel = function(options) {
    if (!defined(options) || !defined(options.application)) {
        throw new DeveloperError('options.application is required.');
    }

    this.application = options.application;

    this.isVisible = false;
    this.features = undefined;
    this.name = '';
    this.html = '';

    knockout.track(this, ['isVisible', 'feature', 'name', 'html']);

    this._domNodes = undefined;

    this.application.featuresPicked.addEventListener(this.showFeatures, this);
};

FeatureInfoPanelViewModel.prototype.show = function(container) {
    if (!defined(this._domNodes)) {
        this._domNodes = loadView(require('fs').readFileSync(__dirname + '/../Views/FeatureInfoPanel.html', 'utf8'), container, this);
    }
};

FeatureInfoPanelViewModel.prototype.close = function() {
    this.isVisible = false;
};

FeatureInfoPanelViewModel.prototype.showFeatures = function(features) {
    this.name = 'Loading...';
    this.html = 'Loading feature information...';
    this.features = features;
    this.isVisible = true;

    var that = this;
    when(features.allFeaturesAvailablePromise, function() {
        if (features !== that.features) {
            return;
        }

        if (features.features.length === 0) {
            that.name = 'None';
            that.html = 'No features found.';
            that.isVisible = true;
            return;
        }

        var feature = features.features[0];
        that.name = feature.name ? feature.name : feature.id;
        that.html = feature.description.getValue();
        that.isVisible = true;
    }, function() {
        that.name = 'Error';
        that.html = features.error;
        that.isVisible = true;
    });

};

module.exports = FeatureInfoPanelViewModel;
