'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadView = require('../Core/loadView');

var RegionDataParameterEditor = function(catalogFunction, parameter, parameterValues) {
    this.catalogFunction = catalogFunction;
    this.parameter = parameter;
    this.parameterValues = parameterValues;

    knockout.defineProperty(this, 'value', {
        get: function() {
            return parameterValues[parameter.id];
        },
        set: function(value) {
            parameterValues[parameter.id] = value;
        }
    });

    knockout.defineProperty(this, 'catalogItemsWithMatchingRegion', {
        get: function() {
            var requiredRegionType = parameter.regionType;
            if (typeof requiredRegionType !== 'string') {
                var regionTypeParameter = requiredRegionType.parameter;
                if (!defined(regionTypeParameter)) {
                    return [];
                }
                requiredRegionType = parameterValues[regionTypeParameter];
            }

            var result = [];

            var nowViewingItems = this.catalogFunction.terria.nowViewing.items;
            for (var i = 0; i < nowViewingItems.length; ++i) {
                var item = nowViewingItems[i];
                if (defined(item._csvCatalogItem)) { // hacktastic way to make ABS work!
                    item._csvCatalogItem.name = item.name;
                    item = item._csvCatalogItem;
                }
                if (defined(item.tableStyle) && defined(item.tableStyle.regionProvider) && item.tableStyle.regionProvider.regionType === requiredRegionType) {
                    result.push(item);
                }
            }

            return result;
        }
    });
};

RegionDataParameterEditor.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/RegionDataParameterEditor.html', 'utf8'), container, this);
};

RegionDataParameterEditor.prototype.toggleActive = function(dataset) {
    dataset.__isActiveForFunctions = !this.isActive(dataset);

    if (!defined(this.value)) {
        this.value = {};
    }

    if (dataset.__isActiveForFunctions) {
        this.value[dataset.name] = dataset.items;
    } else {
        this.value[dataset.name] = undefined;
    }
};

RegionDataParameterEditor.prototype.isActive = function(dataset) {
    if (!defined(dataset.__isActiveForFunctions)) {
        knockout.track(dataset, ['__isActiveForFunctions']);
    }
    return defaultValue(dataset.__isActiveForFunctions, dataset.isActive);
};

module.exports = RegionDataParameterEditor;


//csvItem.tableStyle.regionProvider.regionType
