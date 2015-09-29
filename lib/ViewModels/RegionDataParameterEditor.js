'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadView = require('../Core/loadView');
var svgArrowDown = require('../SvgPaths/svgArrowDown');
var svgArrowRight = require('../SvgPaths/svgArrowRight');
var VarType = require('../Map/VarType');

var RegionDataParameterEditor = function(catalogFunction, parameter, parameterValues) {
    this.catalogFunction = catalogFunction;
    this.parameter = parameter;
    this.parameterValues = parameterValues;
    this.svgArrowDown = svgArrowDown;
    this.svgArrowRight = svgArrowRight;
    this.openItems = {};

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
            var result = [];

            var nowViewingItems = this.catalogFunction.terria.nowViewing.items;
            var requiredRegionType = this.requiredRegionType;
            for (var i = 0; i < nowViewingItems.length; ++i) {
                var item = nowViewingItems[i];
                if (defined(item._csvCatalogItem)) { // hacktastic way to make ABS work!
                    item._csvCatalogItem.name = item.name;
                    item = item._csvCatalogItem;
                }
                if (defined(item._regionProvider) && item._regionProvider.regionType === requiredRegionType) {
                    result.push(item);
                }
            }

            return result;
        }
    });

    knockout.defineProperty(this, 'requiredRegionType', {
        get: function() {
            var requiredRegionType = parameter.regionType;
            if (typeof requiredRegionType !== 'string') {
                var regionTypeParameter = requiredRegionType.parameter;
                if (!defined(regionTypeParameter)) {
                    return [];
                }
                requiredRegionType = parameterValues[regionTypeParameter];
            }
            return requiredRegionType;
        }
    });
};

RegionDataParameterEditor.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/RegionDataParameterEditor.html', 'utf8'), container, this);
};

RegionDataParameterEditor.prototype.toggleActive = function(catalogItem, variable) {
    var newValue = !this.isActive(catalogItem, variable);

    if (newValue) {
        this.value[variable.name] = {
            regions: catalogItem._tableDataSource.dataset.variables[catalogItem._tableDataSource.regionVariable].vals,
            values: catalogItem._tableDataSource.dataset.variables[variable.name].vals
        };
    } else {
        this.value[variable.name] = false;
    }
};

RegionDataParameterEditor.prototype.isActive = function(catalogItem, variable) {
    if (!defined(this.value)) {
        this.value = {};
    }

    if (!defined(this.value[variable.name])) {
        this.value[variable.name] = false;
        knockout.track(this.value, [variable.name]);
        this.value[variable.name] = {
            regions: catalogItem._tableDataSource.dataset.variables[catalogItem._tableDataSource.regionVariable].vals,
            values: catalogItem._tableDataSource.dataset.variables[variable.name].vals
        };
    }

    return defined(this.value[variable.name]) &&
           this.value[variable.name] &&
           this.value[variable.name].regions === catalogItem._tableDataSource.dataset.variables[catalogItem._tableDataSource.regionVariable].vals &&
           this.value[variable.name].values === catalogItem._tableDataSource.dataset.variables[variable.name].vals;
};

RegionDataParameterEditor.prototype.variableIsScalar = function(catalogItem, variable) {
    return catalogItem._tableDataSource.dataset.variables[variable.name].varType === VarType.SCALAR;
};

RegionDataParameterEditor.prototype.catalogItemIsOpen = function(catalogItem) {
    if (!defined(this.openItems[catalogItem.name])) { // TODO: don't key off the name like this.
        this.openItems[catalogItem.name] = true;
        knockout.track(this.openItems, [catalogItem.name]);
    }

    return this.openItems[catalogItem.name];
};

RegionDataParameterEditor.prototype.toggleOpenCatalogItem = function(catalogItem) {
    this.openItems[catalogItem.name] = !this.catalogItemIsOpen(catalogItem);
};

module.exports = RegionDataParameterEditor;


//csvItem.tableStyle.regionProvider.regionType
