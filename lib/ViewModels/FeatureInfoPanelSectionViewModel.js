'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');

var readTemplate = require('../Core/readTemplate');
var loadView = require('../Core/loadView');
var svgArrowDown = require('../SvgPaths/svgArrowDown');
var svgArrowRight = require('../SvgPaths/svgArrowRight');
var ChartViewModel = require('./ChartViewModel');

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
var FeatureInfoPanelSectionViewModel = function(featureInfoPanelViewModel, feature) {
    this.terria = featureInfoPanelViewModel.terria;
    this.featureInfoPanelViewModel = featureInfoPanelViewModel;
    this._clockSubscription = undefined;
    this.feature = feature;
    this.template = defined(feature.imageryLayer) ? feature.imageryLayer.featureInfoTemplate : undefined;
    this.name = feature.name ? feature.name : feature.id;
    this.chartViewModels = [];
    this.updateInfoAndCharts(this.terria.clock);
    var catalogItem = calculateCatalogItem(this.terria.nowViewing, feature);
    this.catalogItemName = defined(catalogItem) ? catalogItem.name : '';
    this.width = undefined;  // any charts embedded in this view will track changes to this width
    this.configureHtmlUpdater();

    this.svgArrowDown = svgArrowDown;
    this.svgArrowRight = svgArrowRight;

    knockout.track(this, ['name', 'infoHtml', 'catalogItemName', 'chartViewModels']);
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

FeatureInfoPanelSectionViewModel.prototype.expandChart = function() {
    // TODO: just a sample chart for now
    var chartPanel = this.featureInfoPanelViewModel.chartPanelViewModel;
    chartPanel.open();
    chartPanel.addChart(new ChartViewModel(this,
        'http://services.aremi.nicta.com.au/aemo/v4/duidcsv/LKBONNY3',
        {
            title: 'Generation',
            showRangeSelector: true
        }
    ));
};

FeatureInfoPanelSectionViewModel.prototype.previewChartViewModelFromAttributes = function(attributes) {
    // return new ChartViewModel(this,
    //     'http://services.aremi.nicta.com.au/aemo/v4/duidcsv/LKBONNY3?offset=24h',
    //     {title: 'Latest 24hr generation'}
    // )
    
    return new ChartViewModel(this, attributes.srcPreview, attributes);
};

function attributesFromChartElement(element) {
    // Risk - if the user puts in attributes that are javascript reserved words, this will cause an error
    var rawAttributes = element.attributes;
    var attributesObject = {};
    var camelName;
    for (var i = rawAttributes.length - 1; i >= 0; i--) {
        camelName = rawAttributes[i].name.replace(/-([a-z])/gi, function (g) { return g[1].toUpperCase(); });
        attributesObject[camelName] = rawAttributes[i].value;
    }
    return attributesObject;
}

function setInfoAndChartsFromDescription(viewModel, description) {
    // extract any <chart> elements using the browser's DOM to parse the html
    var chartViewModels = [];

    function walkFindAndRemoveCharts(element) {
        var nextNode;
        if (element.tagName.toLowerCase() === 'chart') {
            var attributesObject = attributesFromChartElement(element);
            chartViewModels.push(viewModel.previewChartViewModelFromAttributes(attributesObject));
            return true;  // trigger parent node to remove this child
        } else {
            for (var node = element.firstChild; node; node = nextNode) {
                nextNode = node.nextSibling;
                if (node.nodeType === 1) {
                    if (walkFindAndRemoveCharts(node)) {
                        element.removeChild(node);  // removeChild is better supported than plain remove()
                    }
                }
            }
        }
    }

    var wrapper = document.createElement('div');
    wrapper.innerHTML = description;
    walkFindAndRemoveCharts(wrapper);
    viewModel.infoHtml = wrapper.innerHTML;

    viewModel.chartViewModels = chartViewModels;
}


FeatureInfoPanelSectionViewModel.prototype.updateInfoAndCharts = function(clock) {
    // If a template is defined, render it using feature.properties, which is non-time-varying.
    // If no template is provided, show feature.description, which may be time-varying.
    var description;
    var feature = this.feature;
    var data = this.feature.properties;
    if (defined(this.template)) {
        description = readTemplate(data, this.template);
    } else {
        description = feature.description.getValue(clock.currentTime);
        if (description.properties) {
            description = JSON.stringify(description.properties);
        }
    }    
    setInfoAndChartsFromDescription(this, description);
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
