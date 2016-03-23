'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadView = require('../Core/loadView');
var svgArrowDown = require('../SvgPaths/svgArrowDown');
var svgArrowRight = require('../SvgPaths/svgArrowRight');
var VarType = require('../Map/VarType');

var RegionDataParameterEditor = function(options) {
    this.catalogFunction = options.catalogFunction;
    this.parameter = options.parameter;
    this.parameterValues = options.parameterValues;
    this.svgArrowDown = svgArrowDown;
    this.svgArrowRight = svgArrowRight;
    this.catalogItemDetails = {};

    knockout.defineProperty(this, 'value', {
        get: function() {
            return this.parameterValues[this.parameter.id];
        },
        set: function(value) {
            this.parameterValues[this.parameter.id] = value;
        }
    });

    knockout.defineProperty(this, 'regionProvider', {
        get: function() {
            return this.parameter.getRegionProvider(this.parameterValues);
        }
    });

    knockout.defineProperty(this, 'catalogItemsWithMatchingRegion', {
        get: function() {
            return this.parameter.getEnabledItemsWithMatchingRegionType(this.parameterValues);
        }
    });
};

RegionDataParameterEditor.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/RegionDataParameterEditor.html', 'utf8'), container, this);
};

RegionDataParameterEditor.prototype.toggleActive = function(catalogItem, variable) {
    var newValue = !this.isActive(catalogItem, variable);

    if (newValue) {
        var regionVariable = catalogItem._tableDataSource.dataset.variables[catalogItem._tableDataSource.regionVariable];
        this.value[variable.name] = {
            regionProvider: this.regionProvider,
            regions: regionVariable.enumList || regionVariable.vals,
            values: catalogItem._tableDataSource.dataset.variables[variable.name].vals
        };

        // If only one dataset can be active at a time, deactivate all others.
        if (this.parameter.singleSelect) {
            for (var variableName in this.value) {
                if (this.value.hasOwnProperty(variableName) && variableName !== variable.name) {
                    this.value[variableName] = false;
                }
            }
        }
    } else {
        this.value[variable.name] = false;
        getCatalogItemDetails(this.catalogItemDetails, catalogItem).isEntirelyActive = false;
    }
};

RegionDataParameterEditor.prototype.isActive = function(catalogItem, variable) {
    return true;

    // if (!defined(this.value)) {
    //     this.value = {};
    // }

    // var regionVariable;

    // if (!defined(this.value[variable.name])) {
    //     this.value[variable.name] = false;
    //     knockout.track(this.value, [variable.name]);

    //     if (!this.parameter.singleSelect || Object.keys(this.value).length === 1) {
    //         regionVariable = catalogItem._tableDataSource.dataset.variables[catalogItem._tableDataSource.regionVariable];
    //         this.value[variable.name] = {
    //             regionProvider: this.parameter.getRegionProvider(this.parameterValues),
    //             regions: regionVariable.enumList || regionVariable.vals,
    //             values: catalogItem._tableDataSource.dataset.variables[variable.name].vals
    //         };
    //     }
    // }

    // regionVariable = catalogItem._tableDataSource.dataset.variables[catalogItem._tableDataSource.regionVariable];
    // return defined(this.value[variable.name]) &&
    //        this.value[variable.name] &&
    //        this.value[variable.name].regions === (regionVariable.enumList || regionVariable.vals) &&
    //        this.value[variable.name].values === catalogItem._tableDataSource.dataset.variables[variable.name].vals;
};

RegionDataParameterEditor.prototype.columnIsScalar = function(catalogItem, column) {
    return column.type === VarType.SCALAR;
};

RegionDataParameterEditor.prototype.catalogItemIsOpen = function(catalogItem) {
    var details = getCatalogItemDetails(this.catalogItemDetails, catalogItem);
    return details.isOpen;
};

RegionDataParameterEditor.prototype.toggleOpenCatalogItem = function(catalogItem) {
    var details = getCatalogItemDetails(this.catalogItemDetails, catalogItem);
    details.isOpen = !details.isOpen;
};

RegionDataParameterEditor.prototype.isEntireCatalogItemActive = function(catalogItem) {
    var details = getCatalogItemDetails(this.catalogItemDetails, catalogItem);
    return details.isEntirelyActive;
};

RegionDataParameterEditor.prototype.toggleEntireCatalogItem = function(catalogItem) {
    var details = getCatalogItemDetails(this.catalogItemDetails, catalogItem);
    details.isEntirelyActive = !details.isEntirelyActive;

    for (var i = 0; i < catalogItem.csvDataset.items.length; ++i) {
        var variable = catalogItem.csvDataset.items[i];
        if (this.variableIsScalar(catalogItem, variable)) {
            var isActive = this.isActive(catalogItem, variable);
            if ((!isActive && details.isEntirelyActive) || (isActive && !details.isEntirelyActive)) {
                this.toggleActive(catalogItem, variable);
            }
        }
    }
};

function getCatalogItemDetails(catalogItemDetails, catalogItem) {
    if (!defined(catalogItemDetails[catalogItem.name])) { // TODO: don't key off the name like this.
        catalogItemDetails[catalogItem.name] = {
            isOpen: true,
            isEntirelyActive: true
        };
        knockout.track(catalogItemDetails, [catalogItem.name]);
        knockout.track(catalogItemDetails[catalogItem.name], ['isOpen', 'isEntirelyActive']);
    }

    return catalogItemDetails[catalogItem.name];
}

module.exports = RegionDataParameterEditor;
