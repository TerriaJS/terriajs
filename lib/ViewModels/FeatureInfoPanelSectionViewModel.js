'use strict';

/*global require*/
var Mustache = require('mustache');

var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');

var loadView = require('../Core/loadView');
var svgArrowDown = require('../SvgPaths/svgArrowDown');
var svgArrowRight = require('../SvgPaths/svgArrowRight');

var customComponents = require('../Models/customComponents');

var htmlTagRegex = /(<html(.|\s)*>(.|\s)*<\/html>|<body(.|\s)*>(.|\s)*<\/body>|<meta(.|\s)*>)/im;

var widthPadding = 20; // pixels

/**
 * A ViewModel of a Feature Info Panel Section.
 * Contains a single feature for display within the feature info panel.
 * @alias FeatureInfoPanelSectionViewModel
 * @constructor
 *
 * @param {FeatureInfoPanelViewModel} [featureInfoPanelViewModel] The FeatureInfoPanelViewModel instance
 * @param {Cesium.Entity} feature The feature to display.
*/
var FeatureInfoPanelSectionViewModel = function(featureInfoPanelViewModel, feature, catalogItem) {
    this.terria = featureInfoPanelViewModel.terria;
    this.featureInfoPanelViewModel = featureInfoPanelViewModel;
    this._clockSubscription = undefined;
    this.feature = feature;
    this.catalogItemName = defined(catalogItem) ? catalogItem.name : '';

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
    this.updateInfoAndCharts(this.terria.clock);

    this.width = undefined;  // any charts embedded in this view will track changes to this width
    this.configureHtmlUpdater();

    this.svgArrowDown = svgArrowDown;
    this.svgArrowRight = svgArrowRight;

    knockout.track(this, ['name', 'infoHtml', 'catalogItemName']);
    knockout.track(this.terria, ['selectedFeature']);
    knockout.track(this.featureInfoPanelViewModel, ['chartPanelViewModel', 'maxWidth']);

    knockout.getObservable(this.featureInfoPanelViewModel, 'maxWidth').subscribe(function() {
        // TODO: this works, but there must be a better way
        var element = document.getElementsByClassName('feature-info-panel-section-content')[0];
        var elementWidth = element.scrollWidth; // ie. the content width; offsetWidth may be less if there is a scrollbar
        this.width = elementWidth - widthPadding;
    }, this);

    // Use a white background when displaying complete HTML documents rather than just snippets.
    knockout.defineProperty(this, 'useWhiteBackground', {
        get: function() {
            // note we cannot test this.infoHtml as it is the innerHTML of a div wrapper, so would lose its outer <html>
            return htmlTagRegex.test(this.feature.description.getValue());
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
    // remove any custom components
    customComponents.removeInstances(this);
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

FeatureInfoPanelSectionViewModel.prototype.renderCustomComponents = function() {
    customComponents.render(this);
};

function setInfoFromDescription(viewModel, description) {
    // replace custom components (eg. <chart>) with spans with unique ids, using the browser's DOM to parse the html,
    // and update the featureInfoPanelSectionViewModel's infoHtml.

    // TODO: must dispose of old elements if this gets called on every clock tick
    viewModel.infoHtml = customComponents.addFromAndUpdateHtml(description, viewModel);
}


FeatureInfoPanelSectionViewModel.prototype.updateInfoAndCharts = function(clock) {
    // If a template is defined, render it using feature.properties, which is non-time-varying.
    // If no template is provided, show feature.description, which may be time-varying.
    var data = this.feature.properties;
    var description;
    if (defined(this.template)) {
        description = Mustache.render(this.template, data, this.partials);
    } else {
        description = this.feature.description.getValue(clock.currentTime);
        if (description.properties) {
            description = JSON.stringify(description.properties);
        }
    }
    setInfoFromDescription(this, description);
};

FeatureInfoPanelSectionViewModel.prototype.configureHtmlUpdater = function() {
    // When no template is provided, and feature.description is time-varying, we need to keep updating the description
    var that = this;
    if (!defined(this.template) && !this.feature.description.isConstant) {
        // the return value of addEventListener is a function which removes the event listener
        that._clockSubscription = that.terria.clock.onTick.addEventListener(function(clock) {
            that.updateInfoAndCharts(clock);
        });
    }
};


module.exports = FeatureInfoPanelSectionViewModel;
