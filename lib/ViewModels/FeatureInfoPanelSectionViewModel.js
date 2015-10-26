'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
// var Entity = require('terriajs-cesium/Source/DataSources/Entity');

var readTemplate = require('../Core/readTemplate');
var loadView = require('../Core/loadView');
var svgArrowDown = require('../SvgPaths/svgArrowDown');
var svgArrowRight = require('../SvgPaths/svgArrowRight');

var htmlTagRegex = /(<html(.|\s)*>(.|\s)*<\/html>|<body(.|\s)*>(.|\s)*<\/body>|<meta(.|\s)*>)/im;

// TODO: in AREMI, if you load Elec Inf/available capacity, then Substations, and start picking features, 
// I get feature info for a mix of avail cap and substations. 
// But if I do the selection the other way around, I only ever get avail cap.

/**
 * A ViewModel of a Feature Info Panel Section.
 * Contains a single feature for display within the feature info panel.
 *
 * @param {Terria} terria Terria instance.
 * @param {Entity} feature The feature to display.
 * @param {Integer} [maxHeight] The maximum height of the section (optional).
*/
var FeatureInfoPanelSectionViewModel = function(terria, feature, maxHeight) {
    this.terria = terria;
    this.maxHeight = defaultValue(maxHeight, 100000);
    this._clockSubscription = undefined;
    this.feature = feature;
    this.name = feature.name ? feature.name : feature.id;
    this.info = htmlFromFeature(feature, terria.clock);
    this.catalogItem = calculateCatalogItem(terria.nowViewing, feature);
    configureHtmlUpdater(this);

    this.svgArrowDown = svgArrowDown;
    this.svgArrowRight = svgArrowRight;

    knockout.track(this, ['name', 'info', 'maxHeight', 'catalogItem']);
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
};

FeatureInfoPanelSectionViewModel.create = function(options) {
    return new FeatureInfoPanelSectionViewModel(options);
};

function htmlFromFeature(feature, clock) {
    var data = defined(feature.properties) ? feature.properties.getValue(clock.currentTime) : undefined,
        template = defined(feature.imageryLayer) ? feature.imageryLayer.featureInfoTemplate : undefined;
    if (defined(template)) {
        return readTemplate(data, template);
    }
    var description = feature.description.getValue(clock.currentTime);
    if (description.properties) {
        // TODO: move the html out of here
        // eg. for CZML
        var rows = description.properties.map(function(property) {
            return '<tr><td>' + property.key + '</td><td>' + property.value + '</td></tr>';
        }).join('');
        return '<table class="cesium-infoBox-defaultTable">' + rows + '</table>';
    }
    return description;
}

function configureHtmlUpdater(viewModel) {
    var feature = viewModel.feature;
    if (defined(feature.properties) && !feature.properties.isConstant) {
        // the return value of addEventListener is a function which removes the event listener
        viewModel._clockSubscription = viewModel.terria.clock.onTick.addEventListener(function(clock) {
            viewModel.info = htmlFromFeature(feature, clock);
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
    // if there is no data source, for ArcGis (at least) we can match up the imagery layer on the feature with a now-viewing item
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
