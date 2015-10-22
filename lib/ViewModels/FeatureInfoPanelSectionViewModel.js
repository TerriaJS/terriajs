'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');

var readTemplate = require('../Core/readTemplate');
var loadView = require('../Core/loadView');
var htmlTagRegex = /(<html(.|\s)*>(.|\s)*<\/html>|<body(.|\s)*>(.|\s)*<\/body>|<meta(.|\s)*>)/im;

var FeatureInfoPanelSectionViewModel = function(details) {
    // details:
    // terria (required for its clock)
    // feature
    // maxHeight (optional, defaults to 200)
    if (!defined(details) || !defined(details.terria)) {
        throw new DeveloperError('details.terria is required.');
    }
    this.terria = details.terria;
    this.maxHeight = defaultValue(details.maxHeight, 200);
    this._clockSubscription = undefined;
    var feature = details.feature;
    this._feature = feature;
    this.name = feature.name ? feature.name : feature.id;
    this.info = htmlFromFeature(feature, this.terria.clock);
    configureHtmlUpdater(this);

    knockout.track(this, ['name', 'info', 'maxHeight']);

    // Use a white background when displaying complete HTML documents rather than just snippets.
    knockout.defineProperty(this, 'useWhiteBackground', {
        get: function() {
            return htmlTagRegex.test(this.info);
        }
    });

};

/**
 * Shows this panel by adding it to the DOM inside a given container element.
 * @param {DOMNode} container The DOM node to which to add this panel.
 */
FeatureInfoPanelSectionViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/FeatureInfoPanelSection.html', 'utf8'), container, this);
};

FeatureInfoPanelSectionViewModel.prototype.destroy = function() {
    // unsubscribe to any clock subscription
    if (defined(this._clockSubscription)) {
        // remove the event listener
        this._clockSubscription();
        this._clockSubscription = undefined;
    }
    // to be consistent with other destroy methods (probably unnecessary)
    destroyObject(this);
};


FeatureInfoPanelSectionViewModel.create = function(options) {
    return new FeatureInfoPanelSectionViewModel(options);
};

function htmlFromFeature(feature, clock) {
    var data = feature.properties.getValue(clock.currentTime),
        template = feature.imageryLayer.featureInfoTemplate;
    return template ? readTemplate(data, template) : feature.description.getValue(clock.currentTime);
}

function configureHtmlUpdater(viewModel) {
    var feature = viewModel._feature;
    if (defined(feature.properties) && !feature.properties.isConstant) {
        // the return value of addEventListener is a function which removes the event listener
        viewModel._clockSubscription = viewModel.terria.clock.onTick.addEventListener(function(clock) {
            viewModel.info = htmlFromFeature(feature, clock);
        });
    }
}

module.exports = FeatureInfoPanelSectionViewModel;
