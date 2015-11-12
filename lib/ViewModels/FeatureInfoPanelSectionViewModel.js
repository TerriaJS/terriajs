'use strict';

/*global require*/
var Mustache = require('mustache');

var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');

var loadView = require('../Core/loadView');
var svgArrowDown = require('../SvgPaths/svgArrowDown');
var svgArrowRight = require('../SvgPaths/svgArrowRight');

var htmlTagRegex = /(<html(.|\s)*>(.|\s)*<\/html>|<body(.|\s)*>(.|\s)*<\/body>|<meta(.|\s)*>)/im;

/**
 * A ViewModel of a Feature Info Panel Section.
 * Contains a single feature for display within the feature info panel.
 * @alias FeatureInfoPanelSectionViewModel
 * @constructor
 *
 * @param {Terria} terria Terria instance.
 * @param {Cesium.Entity} feature The feature to display.
*/
var FeatureInfoPanelSectionViewModel = function(terria, feature, catalogItem) {
    this.terria = terria;
    this._clockSubscription = undefined;
    this.feature = feature;
    this.name = feature.name ? feature.name : feature.id;
    var template = defined(catalogItem) ? catalogItem.featureInfoTemplate : undefined;
    if (defined(template)) {
        // template may be a string, eg. '<div>{{{Foo}}} Hello {{name}}</div>'
        if (typeof template === 'string') {
            this.template = template;
            this.partials = undefined;
        } else {
            // or template may be an object with 'name', 'template', and/or 'partials' keys
            // eg. {name: '{{Bar}}', template: '<div>test {{>foobar}}</div>', partials: {foobar: '<b>{{Foo}}</b>'} }
            this.template = template.template;
            this.partials = template.partials;
            if (template.name) {
                this.name = Mustache.render(template.name, feature.properties);
            }
        }
    }
    this.info = htmlFromFeature(this, terria.clock);
    this.catalogItemName = defined(catalogItem) ? catalogItem.name : '';
    configureHtmlUpdater(this);

    this.svgArrowDown = svgArrowDown;
    this.svgArrowRight = svgArrowRight;

    knockout.track(this, ['name', 'info', 'catalogItemName']);
    knockout.track(this.terria, ['selectedFeature']);

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

FeatureInfoPanelSectionViewModel.prototype.toggleOpen = function() {
    if (this.terria.selectedFeature === this.feature) {
        this.terria.selectedFeature = undefined;
    } else {
        this.terria.selectedFeature = this.feature;
    }

    // ensure the targeting cursor keeps updating (as it is hooked into the Cesium render loop)
    this.terria.currentViewer.notifyRepaintRequired();
};

function htmlFromFeature(viewModel, clock) {
    // If a template is defined, render it using feature.properties, which is non-time-varying.
    // If no template is provided, show feature.description, which may be time-varying.
    var feature = viewModel.feature;
    var data = feature.properties;
    if (defined(viewModel.template)) {
        return Mustache.render(viewModel.template, data, viewModel.partials);
    }
    var description = feature.description.getValue(clock.currentTime);
    if (description.properties) {
        return JSON.stringify(description.properties);
    }
    return description;
}

function configureHtmlUpdater(viewModel) {
    // When no template is provided, and feature.description is time-varying, we need to keep updating the description
    if (!defined(viewModel.template) && !viewModel.feature.description.isConstant) {
        // the return value of addEventListener is a function which removes the event listener
        viewModel._clockSubscription = viewModel.terria.clock.onTick.addEventListener(function(clock) {
            viewModel.info = htmlFromFeature(viewModel, clock);
        });
    }
}


module.exports = FeatureInfoPanelSectionViewModel;
