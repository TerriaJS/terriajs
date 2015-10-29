'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');

var readTemplate = require('../Core/readTemplate');
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
var FeatureInfoPanelSectionViewModel = function(terria, feature) {
    this.terria = terria;
    this._clockSubscription = undefined;
    this.feature = feature;
    this.template = defined(feature.imageryLayer) ? feature.imageryLayer.featureInfoTemplate : undefined;
    this.name = feature.name ? feature.name : feature.id;
    this.info = htmlFromFeature(this, terria.clock);
    var catalogItem = calculateCatalogItem(terria.nowViewing, feature);
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
    var data = viewModel.feature.properties;
    if (defined(viewModel.template)) {
        return readTemplate(data, viewModel.template);
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

function calculateCatalogItem(nowViewing, feature) {
    // some data sources (czml, geojson, kml) have an entity collection defined on the entity
    // (and therefore the feature)
    // then match up the data source on the feature with a now-viewing item's data source
    var result, i;
    if (defined(feature.entityCollection) && defined(feature.entityCollection.dataSource)) {
        var dataSource = feature.entityCollection.dataSource;
        for (i = nowViewing.items.length - 1; i >= 0; i--) {
            if (nowViewing.items[i].dataSource === dataSource) {
                result = nowViewing.items[i];
                break;
            }
        }
        return result;
    }
    // If there is no data source, but there is an imagery layer (eg. ArcGIS)
    // we can match up the imagery layer on the feature with a now-viewing item.
    if (defined(feature.imageryLayer)) {
        var imageryLayer = feature.imageryLayer;
        for (i = nowViewing.items.length - 1; i >= 0; i--) {
            if (nowViewing.items[i].imageryLayer === imageryLayer) {
                result = nowViewing.items[i];
                break;
            }
        }
        return result;
    }
    // otherwise, no luck
    return undefined;
}

module.exports = FeatureInfoPanelSectionViewModel;
