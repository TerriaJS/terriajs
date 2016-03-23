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

RegionDataParameterEditor.prototype.toggleActive = function(catalogItem, column) {
    var newValue = !this.isActive(catalogItem, column);

    if (newValue) {
        this.value[column.name] = {
            regionProvider: this.regionProvider,
            regions: catalogItem.regionMapping.regionDetails[0].column,
            values: column
        };

        // If only one dataset can be active at a time, deactivate all others.
        if (this.parameter.singleSelect) {
            for (var columnName in this.value) {
                if (this.value.hasOwnProperty(columnName) && columnName !== column.name) {
                    this.value[columnName] = false;
                }
            }
        }
    } else {
        this.value[column.name] = false;
        getCatalogItemDetails(this.catalogItemDetails, catalogItem).isEntirelyActive = false;
    }
};

RegionDataParameterEditor.prototype.isActive = function(catalogItem, column) {
    if (!defined(this.value)) {
        this.value = {};
    }

    if (!defined(this.value[column.name])) {
        this.value[column.name] = false;
        knockout.track(this.value, [column.name]);

        if (!this.parameter.singleSelect || Object.keys(this.value).length === 1) {
            this.value[column.name] = {
                regionProvider: this.parameter.getRegionProvider(this.parameterValues),
                regions: catalogItem.regionMapping.regionDetails[0].column,
                values: column
            };
        }
    }

    return defined(this.value[column.name]) &&
           this.value[column.name] &&
           this.value[column.name].regions === catalogItem.regionMapping.regionDetails[0].column &&
           this.value[column.name].values === column;
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

    var columns = catalogItem.regionMapping.tableStructure.columns;
    for (var i = 0; i < columns.length; ++i) {
        var column = columns[i];
        if (this.columnIsScalar(catalogItem, column)) {
            var isActive = this.isActive(catalogItem, column);
            if ((!isActive && details.isEntirelyActive) || (isActive && !details.isEntirelyActive)) {
                this.toggleActive(catalogItem, column);
            }
        }
    }
};

function getCatalogItemDetails(catalogItemDetails, catalogItem) {
    if (!defined(catalogItemDetails[catalogItem.uniqueId])) {
        catalogItemDetails[catalogItem.uniqueId] = {
            isOpen: true,
            isEntirelyActive: true
        };
        knockout.track(catalogItemDetails, [catalogItem.uniqueId]);
        knockout.track(catalogItemDetails[catalogItem.uniqueId], ['isOpen', 'isEntirelyActive']);
    }

    return catalogItemDetails[catalogItem.uniqueId];
}

module.exports = RegionDataParameterEditor;
