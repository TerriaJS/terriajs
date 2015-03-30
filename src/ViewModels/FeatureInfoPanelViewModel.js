'use strict';

/*global require*/
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var getElement = require('../../third_party/cesium/Source/Widgets/getElement');
var Entity = require('../../third_party/cesium/Source/DataSources/Entity');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var loadView = require('../Core/loadView');

var FeatureInfoPanelViewModel = function(options) {
    if (!defined(options) || !defined(options.application)) {
        throw new DeveloperError('options.application is required.');
    }

    var container = getElement(defaultValue(options.container, document.body));

    this.application = options.application;
    this.features = undefined;

    this.isVisible = false;
    this.name = '';
    this.html = '';
    this.unselectFeaturesOnClose = true;
    this.createFakeSelectedFeatureDuringPicking = true;

    knockout.track(this, ['isVisible', 'name', 'html', 'unselectFeaturesOnClose', 'createFakeSelectedFeatureDuringPicking']);

    this._domNodes = loadView(require('fs').readFileSync(__dirname + '/../Views/FeatureInfoPanel.html', 'utf8'), container, this);

    knockout.getObservable(this, 'isVisible').subscribe(function() {
        if (!this.isVisible && this.unselectFeaturesOnClose) {
            this.application.selectedFeature = undefined;
        }
    }, this);

    knockout.getObservable(this.application, 'pickedFeatures').subscribe(function() {
        this.showFeatures(this.application.pickedFeatures);
    }, this);
};

FeatureInfoPanelViewModel.prototype.close = function() {
    this.isVisible = false;
};

FeatureInfoPanelViewModel.prototype.showFeatures = function(features) {
    if (!defined(features)) {
        this.isVisible = false;
        return;
    }

    this.features = features;
    this.application.selectedFeature = undefined;

    this.name = 'Loading...';
    this.html = 'Loading feature information...';
    this.isVisible = true;

    if (this.createFakeSelectedFeatureDuringPicking) {
        var fakeFeature = new Entity('Pick Location');
        fakeFeature.position = features.pickPosition;
        this.application.selectedFeature = fakeFeature;
    } else {
        this.application.selectedFeature = undefined;
    }

    var that = this;
    when(features.allFeaturesAvailablePromise, function() {
        if (features !== that.features) {
            return;
        }

        if (features.features.length === 0) {
            that.name = 'None';
            that.html = 'No features found.';
            that.isVisible = true;
            that.application.selectedFeature = undefined;
            return;
        }

        var feature = features.features[0];
        that.application.selectedFeature = feature;
        that.name = feature.name ? feature.name : feature.id;
        that.html = feature.description.getValue(that.application.clock.currentTime);
        that.isVisible = true;
    }, function() {
        that.application.selectedFeature = undefined;
        that.name = 'Error';
        that.html = features.error;
        that.isVisible = true;
    });

};

module.exports = FeatureInfoPanelViewModel;
