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
    this.maxHeight = 0;  // actually the section's max height

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

FeatureInfoPanelViewModel.prototype.resetSections = function() {
    this.sections.forEach(function(sectionViewModel) {
        sectionViewModel.destroy();
    });
    this.sections = [];
};

function newSectionfromDetails(panel, details) {
    details.terria = panel.terria;
    details.maxHeight = panel.maxHeight;
    return new FeatureInfoPanelSectionViewModel(details);
}

function resetToSectionfromDetails(panel, details) {
    var sectionViewModel = newSectionfromDetails(panel, details);
    panel.resetSections();
    return panel.addSection(sectionViewModel);
}


FeatureInfoPanelViewModel.prototype.showFeatures = function(features) {
    if (!defined(features)) {
        this.isVisible = false;
        return when();
    }

    this.features = features;
    this.terria.selectedFeature = undefined;
    resetToSectionfromDetails(this, {
        name: 'Loading...',
        html: 'Loading feature information...'
    });
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
            resetToSectionfromDetails(that, {
                name: 'None',
                html: 'No features found.'
            });
            if (that.showPanelWhenNoFeatures) {
                that.isVisible = true;
            } else {
                that.isVisible = false;
            }
            that.terria.selectedFeature = undefined;
            return;
        }
        that.resetSections();
        that.terria.selectedFeature = features.features[0];
        features.features.forEach(function(feature) {
            if (!defined(feature.position)) {
                feature.position = features.pickPosition;
            }
            that.addSection(newSectionfromDetails(that, {
                name: feature.name ? feature.name : feature.id,
                feature: feature
            }));

        });
        that.isVisible = true;
    }, function() {
        that.terria.selectedFeature = undefined;
        resetToSectionfromDetails(that, {
            name: 'Error',
            html: features.error
        });
        that.isVisible = true;
    });
};

FeatureInfoPanelViewModel.create = function(options) {
    return new FeatureInfoPanelViewModel(options);
};

module.exports = FeatureInfoPanelViewModel;
