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

/**
 * The ViewModel of the Feature Info Panel.
 * @alias FeatureInfoPanelViewModel
 * @constructor
 *
 * @param {Object} options An object with the following members:
 * @param {Terria} options.terria The terria instance.
 * @param {Element|String} container The DOM element or ID that will contain the widget.
 * @param {String} [options.name='Feature Information'] Name of the panel, displayed in its title bar.
 * @param {Boolean} [options.showPanelWhenNoFeatures] True if the panel should appear even with no features picked.
 * @param {Integer} [options.horizontalPadding=495] Horizontal padding.
 * @param {Integer} [options.verticalPadding=240] Vertical padding.
 * @param {Integer} [options.unselectDelay=200] Time in milliseconds after the panel is hidden (closed) before the selected feature is unselected.
*/
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
    this.name = defaultValue(options.name, 'Feature Information');
    this._name = this.name;
    this.message = '';
    this.unselectDelay = defaultValue(options.unselectDelay, 200);

    this.horizontalPadding = defaultValue(options.horizontalPadding, 495);
    this.verticalPadding = defaultValue(options.verticalPadding, 240);
    this.maxWidth = 0;
    this.maxHeight = 0;

    knockout.track(this, ['isVisible', 'name', 'message', 'sections',
        'unselectFeaturesOnClose', 'createFakeSelectedFeatureDuringPicking',
        'maxWidth', 'maxHeight']);

    this._domNodes = loadView(require('fs').readFileSync(__dirname + '/../Views/FeatureInfoPanel.html', 'utf8'), container, this);

    var that = this;

    knockout.getObservable(this, 'isVisible').subscribe(function() {
        if (!this.isVisible && this.unselectFeaturesOnClose) {
            // give the close animation time to finish before unselecting, to avoid jumpiness
            setTimeout(function() {
                that.terria.selectedFeature = undefined;
            }, this.unselectDelay);
        }
    }, this);

    knockout.getObservable(this.terria, 'pickedFeatures').subscribe(function() {
        this.showFeatures(this.terria.pickedFeatures);
    }, this);

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

FeatureInfoPanelViewModel.prototype.close = function() {
    // no need to remove sections yet (and that would briefly flash an empty feature info panel as it closes)
    this.isVisible = false;
};

FeatureInfoPanelViewModel.prototype.destroy = function() {
    removeView(this._domNodes);
    this.resetSections();
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

FeatureInfoPanelViewModel.prototype.resetNameAndMessage = function(name, message) {
    this.resetSections();
    this.name = defaultValue(name, this._name);
    this.message = defaultValue(message, '');
};

function newSectionfromFeature(panel, feature) {
    return new FeatureInfoPanelSectionViewModel(panel.terria, feature);
}

FeatureInfoPanelViewModel.prototype.showFeatures = function(features) {
    if (!defined(features)) {
        this.isVisible = false;
        return when();
    }

    this.features = features;
    this.terria.selectedFeature = undefined;
    this.resetNameAndMessage('Loading...', 'Loading feature information...');
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
            that.resetNameAndMessage(undefined, 'No features found.');
            if (that.showPanelWhenNoFeatures) {
                that.isVisible = true;
            } else {
                that.isVisible = false;
            }
            that.terria.selectedFeature = undefined;
            return;
        }
        that.resetNameAndMessage();
        that.resetSections();
        that.terria.selectedFeature = features.features[0];
        features.features.forEach(function(feature) {
            if (!defined(feature.position)) {
                feature.position = features.pickPosition;
            }
            that.addSection(newSectionfromFeature(that, feature));

        });
        that.isVisible = true;
    }, function() {
        that.terria.selectedFeature = undefined;
        that.resetNameAndMessage('Error', features.error);
        that.isVisible = true;
    });
};

FeatureInfoPanelViewModel.create = function(options) {
    return new FeatureInfoPanelViewModel(options);
};

module.exports = FeatureInfoPanelViewModel;
