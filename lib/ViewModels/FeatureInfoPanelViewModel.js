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
var FeatureInfoPanelSectionViewModel = require('./FeatureInfoPanelSectionViewModel');

/**
 * The ViewModel of the Feature Info Panel.
 * @alias FeatureInfoPanelViewModel
 * @constructor
 *
 * @param {Object} options An object with the following members:
 * @param {Terria} options.terria The terria instance.
 * @param {Element|String} container The DOM element or ID that will contain the widget.
 * @param {String} [options.name='Feature Information'] Name of the panel, displayed in its title bar.
 * @param {Boolean} [options.showPanelWhenNoFeatures] True if the panel should appear even with no features picked.
 * @param {Integer} [options.horizontalPadding=495] Horizontal padding.
 * @param {Integer} [options.verticalPadding=240] Vertical padding.
 * @param {Integer} [options.unselectDelay=200] Time in milliseconds after the panel is hidden (closed) before the selected feature is unselected.
*/
var FeatureInfoPanelViewModel = function(options) {
    if (!defined(options) || !defined(options.terria)) {
        throw new DeveloperError('options.terria is required.');
    }

    var container = getElement(defaultValue(options.container, document.body));

    this.terria = options.terria;
    this.features = undefined;

    this.isVisible = false;
    this.sections = [];
    this.unselectFeaturesOnClose = true;
    this.createFakeSelectedFeatureDuringPicking = true;
    this.showPanelWhenNoFeatures = defaultValue(options.showPanelWhenNoFeatures, true);
    this.name = defaultValue(options.name, 'Feature Information');
    this._name = this.name;
    this.message = '';
    this.unselectDelay = defaultValue(options.unselectDelay, 200);

    this.horizontalPadding = defaultValue(options.horizontalPadding, 495);
    this.verticalPadding = defaultValue(options.verticalPadding, 240);
    this.maxWidth = 0;
    this.maxHeight = 0;

    knockout.track(this, ['isVisible', 'name', 'message', 'sections',
        'unselectFeaturesOnClose', 'createFakeSelectedFeatureDuringPicking',
        'maxWidth', 'maxHeight']);

    this._domNodes = loadView(require('fs').readFileSync(__dirname + '/../Views/FeatureInfoPanel.html', 'utf8'), container, this);

    var that = this;

    knockout.getObservable(this, 'isVisible').subscribe(function() {
        if (!this.isVisible && this.unselectFeaturesOnClose) {
            // give the close animation time to finish before unselecting, to avoid jumpiness
            setTimeout(function() {
                that.terria.selectedFeature = undefined;
            }, this.unselectDelay);
        }
    }, this);

    knockout.getObservable(this.terria, 'pickedFeatures').subscribe(function() {
        this.showFeatures(this.terria.pickedFeatures);
    }, this);

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

FeatureInfoPanelViewModel.prototype.closeIfClickOnBackground = function(viewModel, e) {
    if (e.target.className === 'feature-info-panel-holder' || e.target.className === 'feature-info-panel-holder-inner') {
        this.close();
    }
    return true;
};

FeatureInfoPanelViewModel.prototype.close = function() {
    this.isVisible = false;
    var that = this;
    // wait a moment for animations to finish, then dispose of the panel sections - they may have clock subscriptions
    setTimeout(function() {
        that.resetSections();
    }, 400);
};

FeatureInfoPanelViewModel.prototype.destroy = function() {
    removeView(this._domNodes);
    this.resetSections();
    destroyObject(this);
};

FeatureInfoPanelViewModel.prototype.addSection = function(sectionViewModel) {
    this.sections.push(sectionViewModel);
    return sectionViewModel;
};

FeatureInfoPanelViewModel.prototype.resetSections = function() {
    this.sections.forEach(function(sectionViewModel) {
        sectionViewModel.destroy();
    });
    this.sections = [];
};

FeatureInfoPanelViewModel.prototype.resetNameAndMessage = function(name, message) {
    this.resetSections();
    this.name = defaultValue(name, this._name);
    this.message = defaultValue(message, '');
};

function newSectionfromFeature(featureInfoPanelViewModel, feature, catalogItem) {
    return new FeatureInfoPanelSectionViewModel(featureInfoPanelViewModel, feature, catalogItem);
}

FeatureInfoPanelViewModel.prototype.showFeatures = function(features) {
    if (!defined(features)) {
        this.isVisible = false;
        return when();
    }

    this.features = features;
    this.terria.selectedFeature = undefined;
    this.resetNameAndMessage('Loading...', 'Loading feature information...');
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
    return when(features.allFeaturesAvailablePromise, function() {
        if (features !== that.features) {
            return;
        }

        if (features.features.filter(featureHasInfo).length === 0) {
            that.resetNameAndMessage(undefined, 'No features found.');
            if (that.showPanelWhenNoFeatures) {
                that.isVisible = true;
            } else {
                that.isVisible = false;
            }
            that.terria.selectedFeature = undefined;
            return;
        }
        that.resetNameAndMessage();
        that.resetSections();
        that.terria.selectedFeature = features.features.filter(featureHasInfo)[0];
        addSectionsForFeatures(that, features.features);
        that.isVisible = true;
    }, function() {
        that.terria.selectedFeature = undefined;
        that.resetNameAndMessage('Error', features.error);
        that.isVisible = true;
    });
};

FeatureInfoPanelViewModel.create = function(options) {
    return new FeatureInfoPanelViewModel(options);
};

function featureHasInfo(feature) {
    return (defined(feature.properties) || defined(feature.description));
}

// Call addSection for each feature.
// Only show sections up to a limit for each catalog item.
// Do not show sections for features with neither properties nor description.
function addSectionsForFeatures(viewModel, features) {
    var counts = []; // an array of {catalogItem: , count: } objects
    features.forEach(function(feature) {
        if (!featureHasInfo(feature)) {
            return;
        }
        if (!defined(feature.position)) {
            feature.position = features.pickPosition;
        }
        var catalogItem = calculateCatalogItem(viewModel.terria.nowViewing, feature);
        if (!defined(catalogItem)) {
            viewModel.addSection(newSectionfromFeature(viewModel, feature));
        } else {
            var newItem = true;
            var countOfCatalogItem = 0;
            // only show features from each catalog item up to their maximumShownFeatureInfos
            for (var i = counts.length - 1; i >= 0; i--) {
                if (catalogItem === counts[i].catalogItem) {
                    newItem = false;
                    countOfCatalogItem = counts[i].count;
                    counts[i].count = countOfCatalogItem + 1;
                }
            }
            if (newItem) {
                counts.push({catalogItem: catalogItem, count: 1});
            }
            if (countOfCatalogItem < catalogItem.maximumShownFeatureInfos) {
                viewModel.addSection(newSectionfromFeature(viewModel, feature, catalogItem));
            }
        }
    });
    // if any counts were exceeded, add a message to the view model
    for (var i = counts.length - 1; i >= 0; i--) {
        var numberShown = counts[i].catalogItem.maximumShownFeatureInfos;
        var hiddenNumber = counts[i].count - numberShown;
        if (hiddenNumber === 1) {
            // if only one more, there may be more hidden layers viewModel were not requested, so don't specify the exact total number
            viewModel.message += '<p>More than ' + numberShown + ' ' + counts[i].catalogItem.name + ' features were found. ' +
            'The first ' + numberShown + ' are shown below.</p>';
        }
        if (hiddenNumber > 1) {
            viewModel.message += '<p>' + counts[i].count + ' ' + counts[i].catalogItem.name + ' features were found. ' +
            'The first ' + numberShown + ' are shown below.</p>';
        }
    }
}

function calculateCatalogItem(nowViewing, feature) {
    // some data sources (czml, geojson, kml) have an entity collection defined on the entity
    // (and therefore the feature)
    // then match up the data source on the feature with a now-viewing item's data source
    var result, i;
    if (!defined(nowViewing)) {
        // so that specs do not need to define a nowViewing
        return undefined;
    }
    if (defined(feature.entityCollection) && defined(feature.entityCollection.owner)) {
        var dataSource = feature.entityCollection.owner;
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

module.exports = FeatureInfoPanelViewModel;
