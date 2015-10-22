'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var readTemplate = require('../Core/readTemplate');
var loadView = require('../Core/loadView');
var htmlTagRegex = /(<html(.|\s)*>(.|\s)*<\/html>|<body(.|\s)*>(.|\s)*<\/body>|<meta(.|\s)*>)/im;

var FeatureInfoPanelSectionViewModel = function(options) {
    if (!defined(options)) {
        throw new DeveloperError('options required.');
    }

    this.name = options.name || 'None';
    this.html = options.html;
    this.maxHeight = options.maxHeight || 200;

    knockout.track(this, ['name', 'html', 'maxHeight']);

    // Use a white background when displaying complete HTML documents rather than just snippets.
    knockout.defineProperty(this, 'useWhiteBackground', {
        get: function() {
            return htmlTagRegex.test(this.html);
        }
    });

    this._clockSubscription = undefined;
};

/**
 * Shows this panel by adding it to the DOM inside a given container element.
 * @param {DOMNode} container The DOM node to which to add this panel.
 */
FeatureInfoPanelSectionViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/FeatureInfoPanelSection.html', 'utf8'), container, this);
};

// FeatureInfoPanelSectionViewModel.prototype.destroy = function() {
//     removeView(this._domNodes);
//     destroyObject(this);
// };

FeatureInfoPanelSectionViewModel.prototype.close = function() {
    // TODO: bring isVisible to this view model
    // this.isVisible = false;
};


FeatureInfoPanelSectionViewModel.create = function(options) {
    return new FeatureInfoPanelSectionViewModel(options);
};

// TODO - hook in
function configureHtmlUpdater(viewModel, feature) {
    if (defined(viewModel._clockSubscription)) {
        // remove the event listener
        viewModel._clockSubscription();
        viewModel._clockSubscription = undefined;
    }
    if (defined(feature)) {
        // TODO: is feature.properties.isConstant the right way to check for this -
        //       eg. feature.properties.getValue().isConstant
        if (defined(feature.properties) && !feature.properties.isConstant) {
            // the return value of addEventListener is a function which removes the event listener
            viewModel._clockSubscription = viewModel.terria.clock.onTick.addEventListener(function(clock) {
                //viewModel.html = featureDescription.getValue(clock.currentTime);
                var data = feature.properties.getValue(clock.currentTime),
                    template = feature.imageryLayer.featureInfoTemplate;
                viewModel.html = template ? readTemplate(data, template) : feature.description.getValue(clock.currentTime);
            });
        }
    }
}

module.exports = FeatureInfoPanelSectionViewModel;
