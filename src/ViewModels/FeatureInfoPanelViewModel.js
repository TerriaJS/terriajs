'use strict';

/*global require*/
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var getElement = require('../../third_party/cesium/Source/Widgets/getElement');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var loadView = require('../Core/loadView');
var SelectionIndicatorViewModel = require('./SelectionIndicatorViewModel');

var FeatureInfoPanelViewModel = function(options) {
    if (!defined(options) || !defined(options.application)) {
        throw new DeveloperError('options.application is required.');
    }

    var container = getElement(defaultValue(options.container, document.body));
    var viewerElement = getElement(options.viewerElement);

    this.application = options.application;

    this.selectionIndicator = new SelectionIndicatorViewModel(this.application, viewerElement);

    this.isVisible = false;
    this.features = undefined;
    this.name = '';
    this.html = '';

    knockout.track(this, ['isVisible', 'feature', 'name', 'html']);

    this._domNodes = undefined;

    this.application.featuresPicked.addEventListener(this.showFeatures, this);

    this._domNodes = loadView(require('fs').readFileSync(__dirname + '/../Views/FeatureInfoPanel.html', 'utf8'), container, this);
};

FeatureInfoPanelViewModel.prototype.close = function() {
    this.isVisible = false;
};

FeatureInfoPanelViewModel.prototype.showFeatures = function(features) {
    this.name = 'Loading...';
    this.html = 'Loading feature information...';
    this.features = features;
    this.isVisible = true;
    this.selectionIndicator.isVisible = false;

    var that = this;
    when(features.allFeaturesAvailablePromise, function() {
        if (features !== that.features) {
            return;
        }

        if (features.features.length === 0) {
            that.name = 'None';
            that.html = 'No features found.';
            that.isVisible = true;
            that.selectionIndicator.isVisible = false;
            return;
        }

        var feature = features.features[0];
        that.name = feature.name ? feature.name : feature.id;
        that.html = feature.description.getValue(that.application.clock.currentTime);
        if (feature.position) {
            that.selectionIndicator.position = feature.position.getValue(that.application.clock.currentTime);
        } else {
            that.selectionIndicator.position = undefined;
        }
        that.selectionIndicator.isVisible = true;
        that.selectionIndicator.update();
        that.isVisible = true;
    }, function() {
        that.name = 'Error';
        that.html = features.error;
        that.isVisible = true;
    });

};

module.exports = FeatureInfoPanelViewModel;
