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

var htmlTagRegex = /<html(.|\s)*>(.|\s)*<\/html>/im;

var FeatureInfoPanelViewModel = function(options) {
    if (!defined(options) || !defined(options.terria)) {
        throw new DeveloperError('options.terria is required.');
    }

    var container = getElement(defaultValue(options.container, document.body));

    this.terria = options.terria;
    this.features = undefined;

    this.isVisible = false;
    this.name = '';
    this.html = '';
    this.unselectFeaturesOnClose = true;
    this.createFakeSelectedFeatureDuringPicking = true;

    this.horizontalPadding = defaultValue(options.horizontalPadding, 495);
    this.verticalPadding = defaultValue(options.verticalPadding, 240);
    this.maxWidth = 0;
    this.maxHeight = 0;

    knockout.track(this, ['isVisible', 'name', 'html', 'unselectFeaturesOnClose', 'createFakeSelectedFeatureDuringPicking', 'maxWidth', 'maxHeight']);

    // Use a white background when displaying complete HTML documents rather than just snippets.
    knockout.defineProperty(this, 'useWhiteBackground', {
        get: function() {
            return htmlTagRegex.test(this.html);
        }
    });

    this._clockSubscription = undefined;
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
    }

    updateMaxDimensions();

    window.addEventListener('resize', function() {
        updateMaxDimensions();
    }, false);
};

FeatureInfoPanelViewModel.prototype.close = function() {
    this.isVisible = false;
};

FeatureInfoPanelViewModel.prototype.destroy = function() {
    removeView(this._domNodes);
    destroyObject(this);
};

FeatureInfoPanelViewModel.prototype.showFeatures = function(features) {
    if (!defined(features)) {
        this.isVisible = false;
        return;
    }

    this.features = features;
    this.terria.selectedFeature = undefined;

    this.name = 'Loading...';
    this.html = 'Loading feature information...';
    configureHtmlUpdater(this, undefined);
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
    when(features.allFeaturesAvailablePromise, function() {
        if (features !== that.features) {
            return;
        }

        if (features.features.length === 0) {
            that.name = 'None';
            that.html = 'No features found.';
            configureHtmlUpdater(that, undefined);
            that.isVisible = true;
             that.terria.selectedFeature = undefined;
            return;
        }

        var feature = features.features[0];
        if (!defined(feature.position)) {
            feature.position = features.pickPosition;
        }

         that.terria.selectedFeature = feature;
        that.name = feature.name ? feature.name : feature.id;
        if (defined(feature.description)) {
            that.html = feature.description.getValue( that.terria.clock.currentTime);
        } else {
            that.html = '';
        }
        configureHtmlUpdater(that, feature.description);
        that.isVisible = true;
    }, function() {
         that.terria.selectedFeature = undefined;
        that.name = 'Error';
        that.html = features.error;
        configureHtmlUpdater(that, undefined);
        that.isVisible = true;
    });
};

FeatureInfoPanelViewModel.create = function(options) {
    return new FeatureInfoPanelViewModel(options);
};

function configureHtmlUpdater(viewModel, featureDescription) {
    if (defined(viewModel._clockSubscription)) {
        viewModel._clockSubscription();
        viewModel._clockSubscription = undefined;
    }

    if (defined(featureDescription) && !featureDescription.isConstant) {
        viewModel._clockSubscription = viewModel.terria.clock.onTick.addEventListener(function(clock) {
            viewModel.html = featureDescription.getValue(clock.currentTime);
        });
    }
}

module.exports = FeatureInfoPanelViewModel;
