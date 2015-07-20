'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var definedNotNull = require('terriajs-cesium/Source/Core/definedNotNull');
var isArray = require('terriajs-cesium/Source/Core/isArray');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var getElement = require('terriajs-cesium/Source/Widgets/getElement');
var Entity = require('terriajs-cesium/Source/DataSources/Entity');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var loadView = require('../Core/loadView');
var removeView = require('../Core/removeView');

var htmlTagRegex = /(<html(.|\s)*>(.|\s)*<\/html>|<body(.|\s)*>(.|\s)*<\/body>|<meta(.|\s)*>)/im;

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
    this.showPanelWhenNoFeatures = defaultValue(options.showPanelWhenNoFeatures, true);

    this.horizontalPadding = defaultValue(options.horizontalPadding, 495);
    this.verticalPadding = defaultValue(options.verticalPadding, 240);
    this.maxWidth = 0;
    this.maxHeight = 0;

    this.enableJSONViewer = true;

    knockout.track(this, ['isVisible', 'name', 'html', 'unselectFeaturesOnClose', 'createFakeSelectedFeatureDuringPicking', 'maxWidth', 'maxHeight', 'enableJSONViewer']);

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

FeatureInfoPanelViewModel.prototype.close = function() {
    this.isVisible = false;
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
            if (that.showPanelWhenNoFeatures) {
                that.isVisible = true;
            } else {
                that.isVisible = false;
            }
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
            var description = feature.description.getValue(that.terria.clock.currentTime);
            if(typeof description === "object") {
                that.html = convertToExplicitTree(description);
            } else {
                that.html = description;
            }
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
            console.log("from clock");
            viewModel.html = featureDescription.getValue(clock.currentTime);
        });
    }
}

function convertToExplicitTree(object, objectIsArray) {
    var result = [];

    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            var value = object[key];
            if (definedNotNull(value)) {
                if(typeof value === 'object') {
                    if(isArray(value)) {
                        result.push({ key: key, value: convertToExplicitTree(value, true) });
                    } else {
                        if(objectIsArray) {
                            result.push({ key: null, value: convertToExplicitTree(value, false) });
                        } else {
                            result.push({ key: key, value: convertToExplicitTree(value, false) });
                        }
                    }
                } else {
                    result.push({ key: key, value: value });
                }
            }
        }
    }

    return result;
}

module.exports = FeatureInfoPanelViewModel;
