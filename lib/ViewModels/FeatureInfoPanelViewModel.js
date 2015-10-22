'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var getElement = require('terriajs-cesium/Source/Widgets/getElement');
var Entity = require('terriajs-cesium/Source/DataSources/Entity');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var readTemplate = require('../Core/readTemplate');
var loadView = require('../Core/loadView');
var removeView = require('../Core/removeView');
var FeatureInfoPanelSectionViewModel = require('./FeatureInfoPanelSectionViewModel');

var FeatureInfoPanelViewModel = function(options) {
    if (!defined(options) || !defined(options.terria)) {
        throw new DeveloperError('options.terria is required.');
    }

    var container = getElement(defaultValue(options.container, document.body));

    this.terria = options.terria;
    this.features = undefined;

    this.isVisible = false;
    this.sections = [];
    this.unselectFeaturesOnClose = true;
    this.createFakeSelectedFeatureDuringPicking = true;
    this.showPanelWhenNoFeatures = defaultValue(options.showPanelWhenNoFeatures, true);

    this.horizontalPadding = defaultValue(options.horizontalPadding, 495);
    this.verticalPadding = defaultValue(options.verticalPadding, 240);
    this.maxWidth = 0;
    this.maxHeight = 0;

    knockout.track(this, ['isVisible', 'sections', 'unselectFeaturesOnClose', 'createFakeSelectedFeatureDuringPicking', 'maxWidth', 'maxHeight']);

    this._domNodes = loadView(require('fs').readFileSync(__dirname + '/../Views/FeatureInfoPanel.html', 'utf8'), container, this);

    knockout.getObservable(this, 'isVisible').subscribe(function() {
        if (!this.isVisible && this.unselectFeaturesOnClose) {
            this.terria.selectedFeature = undefined;
        }
    }, this);

    knockout.getObservable(this.terria, 'pickedFeatures').subscribe(function() {
        this.showFeatures(this.terria.pickedFeatures);
    }, this);

    var that = this;

    function updateMaxDimensions() {
        that.maxWidth = container.clientWidth - that.horizontalPadding;
        that.maxHeight = container.clientHeight - that.verticalPadding;

        if (that.maxWidth < 200 || that.maxHeight < 200) {
            // Small screen, allow the feature info panel to cover almost all of it.
            that.maxWidth = container.clientWidth - 30;
            that.maxHeight = container.clientHeight - 80;
        }
    }

    updateMaxDimensions();

    window.addEventListener('resize', function() {
        updateMaxDimensions();
    }, false);
};

FeatureInfoPanelViewModel.prototype.closeIfClickOnBackground = function(viewModel, e) {
    if (e.target.className === 'feature-info-panel-holder' || e.target.className === 'feature-info-panel-holder-inner') {
        this.close();
    }
    return true;
};

FeatureInfoPanelViewModel.prototype.destroy = function() {
    removeView(this._domNodes);
    destroyObject(this);
};

FeatureInfoPanelViewModel.prototype.addSection = function(sectionViewModel) {
    this.sections.push(sectionViewModel);
    return sectionViewModel;
};

FeatureInfoPanelViewModel.prototype.resetToLoadingSection = function() {
    var sectionViewModel = new FeatureInfoPanelSectionViewModel({
        name: 'Loading...',
        html: 'Loading feature information...'
    });
    this.sections = [sectionViewModel];
    return sectionViewModel;
};

FeatureInfoPanelViewModel.prototype.resetToNoneFoundSection = function() {
    var sectionViewModel = new FeatureInfoPanelSectionViewModel({
        name: 'None',
        html: 'No features found.'
    });
    this.sections = [sectionViewModel];
    return sectionViewModel;
};

FeatureInfoPanelViewModel.prototype.resetToErrorSection = function(html) {
    var sectionViewModel = new FeatureInfoPanelSectionViewModel({
        name: 'Error',
        html: html
    });
    this.sections = [sectionViewModel];
    return sectionViewModel;
};

FeatureInfoPanelViewModel.prototype.showFeatures = function(features) {
    if (!defined(features)) {
        this.isVisible = false;
        return when();
    }

    this.features = features;
    this.terria.selectedFeature = undefined;
    this.resetToLoadingSection();
    this.isVisible = true;

    if (this.createFakeSelectedFeatureDuringPicking) {
        var fakeFeature = new Entity({
            id: 'Pick Location'
        });
        fakeFeature.position = features.pickPosition;
        this.terria.selectedFeature = fakeFeature;
    } else {
        this.terria.selectedFeature = undefined;
    }

    var that = this;
    return when(features.allFeaturesAvailablePromise, function() {
        if (features !== that.features) {
            return;
        }

        if (features.features.length === 0) {
            that.resetToNoneFoundSection();
            if (that.showPanelWhenNoFeatures) {
                that.isVisible = true;
            } else {
                that.isVisible = false;
            }
            that.terria.selectedFeature = undefined;
            return;
        }

        that.terria.selectedFeature = features.features[0];
        features.features.forEach(function(feature) {
            if (!defined(feature.position)) {
                feature.position = features.pickPosition;
            }
            var html = '';
            if (defined(feature.properties)) {
                var data = feature.properties.getValue(that.terria.clock.currentTime),
                    template = feature.imageryLayer.featureInfoTemplate;
                html = template ? readTemplate(data, template) : feature.description.getValue(that.terria.clock.currentTime);
            }
            that.addSection(new FeatureInfoPanelSectionViewModel({
                name: feature.name ? feature.name : feature.id,
                html: html
            }));

        });
        that.isVisible = true;
    }, function() {
        that.terria.selectedFeature = undefined;
        that.resetToErrorSection(features.error);
        that.isVisible = true;
    });
};

FeatureInfoPanelViewModel.create = function(options) {
    return new FeatureInfoPanelViewModel(options);
};

module.exports = FeatureInfoPanelViewModel;
