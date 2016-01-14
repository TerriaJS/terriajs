'use strict';

/*global require*/
var Mustache = require('mustache');

var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var isArray = require('terriajs-cesium/Source/Core/isArray');

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
 * @param {FeatureInfoPanelViewModel} [featureInfoPanelViewModel] The FeatureInfoPanelViewModel instance
 * @param {Cesium.Entity} feature The feature to display.
*/
var FeatureInfoPanelSectionViewModel = function(featureInfoPanelViewModel, feature, catalogItem) {
    this.terria = featureInfoPanelViewModel.terria;
    this.featureInfoPanelViewModel = featureInfoPanelViewModel;
    this._clockSubscription = undefined;
    this.feature = feature;
    this.name = feature.name ? feature.name : '';
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
                this.name = Mustache.render(template.name, propertyValues(feature.properties, this.terria.clock));
            }
        }
    }
    this.info = htmlFromFeature(this, this.terria.clock);
    this.catalogItemName = defined(catalogItem) ? catalogItem.name : '';
    configureHtmlUpdater(this);

    this.svgArrowDown = svgArrowDown;
    this.svgArrowRight = svgArrowRight;

    knockout.track(this, ['name', 'info', 'catalogItemName']);
    knockout.track(this.terria, ['selectedFeature']);

    // Use a white background when displaying complete HTML documents rather than just snippets.
    knockout.defineProperty(this, 'useWhiteBackground', {
        get: function() {
            // note we cannot test this.info as it is the innerHTML of a div wrapper, so would lose its outer <html>
            return htmlTagRegex.test(this.feature.description && this.feature.description.getValue());
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

// Recursively replace '.' and '#' in property keys with _, since Mustache cannot reference keys with these characters.
function replaceBadKeyCharacters(properties) {
    // if properties is anything other than an Object type, return it. Otherwise recurse through its properties.
    if (!properties || typeof properties !== 'object' || isArray(properties)) {
        return properties;
    }

    var result = {};

    for (var key in properties) {
        if (properties.hasOwnProperty(key)) {
            var cleanKey = key.replace(/[.#]/g, '_');
            result[cleanKey] = replaceBadKeyCharacters(properties[key]);
        }
    }
    return result;

}

function propertyValues(properties, clock) {
    // Check each property for a getValue function; if it exists, use it to get the current value.
    var result = {};
    var currentTime = clock.currentTime;
    for (var key in properties) {
        if (properties.hasOwnProperty(key)) {
            if (properties[key] && typeof properties[key].getValue === 'function') {
                result[key] = properties[key].getValue(currentTime);
            } else {
                result[key] = properties[key];
            }
        }
    }
    return replaceBadKeyCharacters(result);
}

function htmlFromFeature(viewModel, clock) {
    // If a template is defined, render it using feature.properties, which is non-time-varying.
    // If no template is provided, show feature.description, which may be time-varying.
    var description;
    var feature = viewModel.feature;
    var data = propertyValues(feature.properties, clock);
    if (defined(viewModel.template)) {
        description = Mustache.render(viewModel.template, data, viewModel.partials);
    } else if (defined(feature.description)) {
        description = feature.description.getValue(clock.currentTime);
    } else {
        if (defined(data)) {
            // There is no template, and no description - just return the properties as JSON.
            description = JSON.stringify(data);
        }
    }
    // Replace custom components (eg. <chart>) with spans with unique ids, using the browser's DOM to parse the html,
    // and update the featureInfoPanelSectionViewModel's info.
    return description;
 }

function addInfoUpdater(viewModel) {
    // the return value of addEventListener is a function which removes the event listener
    viewModel._clockSubscription = viewModel.terria.clock.onTick.addEventListener(function(clock) {
        viewModel.info = htmlFromFeature(viewModel, clock);
    });
}

function areAllPropertiesConstant(properties) {
    // test this by assuming property is time-varying only if property.isConstant === false.
    // (so if it is undefined or true, it is constant.)
    var result = true;
    for (var key in properties) {
        if (properties.hasOwnProperty(key)) {
            result = result && properties[key] && (properties[key].isConstant !== false);
        }
    }
    return result;
}

function configureHtmlUpdater(viewModel) {
    // The info is constant if:
    // No template is provided, and feature.description is defined and constant,
    // OR
    // A template is provided and all feature.properties are constant.
    // If info is NOT constant, we need to keep updating the description.
    var isConstant = !defined(viewModel.template) && defined(viewModel.feature.description) && viewModel.feature.description.isConstant;
    isConstant = isConstant || (defined(viewModel.template) && areAllPropertiesConstant(viewModel.feature.properties));
    if (!isConstant) {
        addInfoUpdater(viewModel);
    }
}


module.exports = FeatureInfoPanelSectionViewModel;
