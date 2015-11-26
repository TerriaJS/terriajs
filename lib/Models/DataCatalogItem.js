'use strict';

/*global require*/
var clone = require('terriajs-cesium/Source/Core/clone');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
// var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
// var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadText = require('terriajs-cesium/Source/Core/loadText');
// var when = require('terriajs-cesium/Source/ThirdParty/when');

var CatalogItem = require('./CatalogItem');
var inherit = require('../Core/inherit');
// var CsvDataset = require('./CsvDataset');
// var CsvVariable = require('./CsvVariable');
var DataTable = require('../Map/DataTable');
var Metadata = require('./Metadata');
// var ModelError = require('./ModelError');
// var TableStyle = require('../Map/TableStyle');

/**
 * A {@link CatalogItem} representing non-geospatial data.
 *
 * @alias DataCatalogItem
 * @constructor
 * @extends CatalogItem
 *
 * @param {Terria} terria The Terria instance.
 * @param {String} [url] The URL from which to retrieve the data.
 * @param {String|Integer} [column] The column title or number corresponding to this variable
 */
var DataCatalogItem = function(terria, url, options) {
    CatalogItem.call(this, terria);

    this._dataTable = new DataTable();
    this._type = 'data';
    this._typeName = 'Non-spatial data';

    this.url = url;
    this.options = options;

    if (defined(options.name)) {
        this.name = options.name;
    } else if (defined(options.title)) {
        this.name = options.title;
    }
    this.description = defaultValue(options.description, '');

    /**
     * Gets the data table for this catalog item.
     * @memberOf DataCatalogItem.prototype
     * @type {DataTable}
     */
    knockout.defineProperty(this, 'dataTable', {
        get : function() {
            return this._dataTable;
        }
    });

    var that = this;
    knockout.defineProperty(this, 'concepts', {
        get : function() {
            var displayVariablesConcept = that._dataTable.displayVariablesConcept;
            displayVariablesConcept.updateFunction = function(varName) {
                console.log('updateFunction triggered', varName);
            };
            return [displayVariablesConcept];
        }
    });

};

inherit(CatalogItem, DataCatalogItem);

defineProperties(DataCatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance, eg. 'data'.
     * @memberOf CsvCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return this._type;
        }
    },

    /**
     * Gets a human-readable name for this type of data source, eg. 'Non-spatial data'.
     * @memberOf CsvCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return this._typeName;
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf CsvCatalogItem.prototype
     * @type {Metadata}
     */
    metadata : {
        get : function() {
            var result = new Metadata();
            result.isLoading = false;
            result.dataSourceErrorMessage = 'This data source does not have any details available.';
            result.serviceErrorMessage = 'This service does not have any details available.';
            return result;
        }
    },

    /**
     * Gets a value indicating whether this data source, when enabled, can be reordered with respect to other data sources.
     * Data sources that cannot be reordered are typically displayed above reorderable data sources.
     * @memberOf DataCatalogItem.prototype
     * @type {Boolean}
     */
    supportsReordering : {
        get : function() {
            return true;
        }
    },

    /**
     * Gets a value indicating whether the opacity of this data source can be changed.
     * @memberOf DataCatalogItem.prototype
     * @type {Boolean}
     */
    supportsOpacity : {
        get : function() {
            return false;
        }
    },

    /**
     * Gets the Cesium or Leaflet imagery layer object associated with this data source.
     * This property is undefined if the data source is not enabled.
     * @memberOf DataCatalogItem.prototype
     * @type {Object}
     */
    imageryLayer : {
        get : function() {
            return undefined;
        }
    },

    /**
     * Gets the set of names of the properties to be serialized for this object when {@link CatalogMember#serializeToJson} is called
     * and the `serializeForSharing` flag is set in the options.
     * @memberOf DataCatalogItem.prototype
     * @type {String[]}
     */
    propertiesForSharing : {
        get : function() {
            return DataCatalogItem.defaultPropertiesForSharing;
        }
    },

    /**
     * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @memberOf DataCatalogItem.prototype
     * @type {Object}
     */
    updaters : {
        get : function() {
            return DataCatalogItem.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
     * When a property name on the model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf DataCatalogItem.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return DataCatalogItem.defaultSerializers;
        }
    },
    /**
     * Gets the data source associated with this catalog item.
     * @memberOf DataCatalogItem.prototype
     * @type {DataSource}
     */
    dataSource : {
        get : function() {
            return undefined;
        }
    }
});

DataCatalogItem.defaultUpdaters = clone(CatalogItem.defaultUpdaters);

DataCatalogItem.defaultUpdaters.csvDataset = function(item, json, propertyName, options) {
    // Don't update from JSON.
};

// DataCatalogItem.defaultUpdaters.tableStyle = function(csvItem, json, propertyName, options) {
//     csvItem[propertyName] = new TableStyle(json[propertyName]);
// };

freezeObject(DataCatalogItem.defaultUpdaters);

DataCatalogItem.defaultSerializers = clone(CatalogItem.defaultSerializers);

DataCatalogItem.defaultSerializers.csvDataset = function(item, json, propertyName) {
    // Don't serialize.
};

// DataCatalogItem.defaultSerializers.tableStyle = function(csvItem, json, propertyName, options) {
//     json[propertyName] = csvItem[propertyName].toJSON();
// };


freezeObject(DataCatalogItem.defaultSerializers);

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived object with the
 * `serializeForSharing` flag set in the options.
 * @type {String[]}
 */
// DataCatalogItem.defaultPropertiesForSharing = clone(CatalogItem.defaultPropertiesForSharing);
// DataCatalogItem.defaultPropertiesForSharing.push('keepOnTop');
// DataCatalogItem.defaultPropertiesForSharing.push('disableUserChanges');
// DataCatalogItem.defaultPropertiesForSharing.push('opacity');
// DataCatalogItem.defaultPropertiesForSharing.push('tableStyle');
// freezeObject(DataCatalogItem.defaultPropertiesForSharing);


DataCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url];
};

DataCatalogItem.prototype._load = function() {
    if (!defined(this.url)) {
        return;
    }
    this.isLoading = true;
    var that = this;
    return loadText(this.url).then(function(text) {
        // TODO: for now, load as csv, but it would be nice to auto-detect json
        // DataTable's loadText loads a csv file, and loadJson loads a json file
		that._dataTable.loadText(text);
        that.isLoading = false;
    });
};

/**
 * Enables this data item.  This method:
 * * Should not be called directly.  Instead, set the {@link CatalogItem#isEnabled} property to true.
 * * Will not necessarily be called immediately when {@link CatalogItem#isEnabled} is set to true; it will be deferred until
 *   {@link CatalogItem#isLoading} is false.
 * * Should NOT also show the data item on the globe/map (see {@link CatalogItem#_show}), so in some cases it may not do
 *   anything at all.
*/
DataCatalogItem.prototype._enable = function() {
    // no need to do anything
};

DataCatalogItem.prototype._disable = function() {
    // no need to do anything
};

/**
 * Shows this data item.  This method:
 * * Should not be called directly.  Instead, set the {@link CatalogItem#isShown} property to true.
 * * Will only be called after {@link CatalogItem#_enable}; you can count on that method having been called first.
 * * Will not necessarily be called immediately when {@link CatalogItem#isShown} is set to true; it will be deferred until
 *   {@link CatalogItem#isLoading} is false.
 */
DataCatalogItem.prototype._show = function() {
    // open the chart panel if not already, and show the chart
};

/**
 * Hides this data item.  This method:
 * * Should not be called directly.  Instead, set the {@link CatalogItem#isShown} property to false.
 * * Will not be called if {@link CatalogItem#_show} was not called (for example, because the previous call was deferred
 *   while the data item loaded, and the user hid the data item before the load completed).
 */
DataCatalogItem.prototype._hide = function() {
    // remove from the chart, and hide the chart panel if appropriate
};


// DataCatalogItem.prototype._enable = function() {
//     if (this._regionMapped) {
//         this._imageryLayer = ImageryLayerCatalogItem.enableLayer(this, this._createImageryProvider(), this.opacity);

//         if (defined( this.terria.leaflet)) {
//             var that = this;
//             this._imageryLayer.setFilter(function () {
//                 new L.CanvasFilter(this, {
//                     channelFilter: function (image) {
//                         return ImageryProviderHooks.recolorImage(image, that._colorFunc);
//                     }
//                 }).render();
//             });
//         }
//     }
// };

// DataCatalogItem.prototype._disable = function() {
//     if (this._regionMapped) {
//         ImageryLayerCatalogItem.disableLayer(this, this._imageryLayer);
//         this._imageryLayer = undefined;
//     }
// };

// DataCatalogItem.prototype._show = function() {
//     if (!this._regionMapped) {
//         var dataSources =  this.terria.dataSources;
//         if (dataSources.contains(this._tableDataSource)) {
//             throw new DeveloperError('This data source is already shown.');
//         }

//         dataSources.add(this._tableDataSource);
//     }
//     else {
//         ImageryLayerCatalogItem.showLayer(this, this._imageryLayer);
//     }
// };

// DataCatalogItem.prototype._hide = function() {
//     if (!this._regionMapped) {
//         var dataSources =  this.terria.dataSources;
//         if (!dataSources.contains(this._tableDataSource)) {
//             throw new DeveloperError('This data source is not shown.');
//         }

//         dataSources.remove(this._tableDataSource, false);
//     }
//     else {
//         ImageryLayerCatalogItem.hideLayer(this, this._imageryLayer);
//     }
// };

// /* Sets up the UI so the user can choose diffferent variables */
// function initCsvDataset(csvItem) {
//     if (csvItem.disableUserChanges) {
//         return;
//     }
//     var source = csvItem._tableDataSource;
//     var varNames = source.dataset.getVariableNamesByType([VarType.ALT, VarType.SCALAR, VarType.ENUM, VarType.TIME]);
//     if (varNames.length > 0) {
//         //create ko dataset for now viewing ui
//         var csvDataset = new CsvDataset();
//         for (var i = 0; i < varNames.length; i++) {
//             csvDataset.items.push(new CsvVariable(varNames[i], csvDataset));
//         }
//         csvDataset.setSelected(source.dataset.getDataVariable(true));
//         csvDataset.updateFunction = function (varName) {
//             //set new variable and clear var specific styling
//             var tableStyle = csvItem._tableStyle;
//             tableStyle.dataVariable = varName;
//             tableStyle.minDisplayValue = undefined;
//             tableStyle.maxDisplayValue = undefined;
//             tableStyle.featureInfoFields = undefined;
//             tableStyle.legendTicks = 0;
//             updateTableStyle(csvItem, tableStyle);

//             csvItem.legendUrl = source.getLegendGraphic();
//             csvItem.terria.currentViewer.notifyRepaintRequired();
//         };
//         csvItem.csvDataset = csvDataset;
//     }
// }
//  Creates a new clock from a region-mapped datasource. 
// function initClockFromDataSource(csvItem) {
//     var source = csvItem._tableDataSource;
//     if (!csvItem._regionMapped) {
//         return source.clock;
//     }
//     if (defined(csvItem.clock)) {
//         return csvItem.clock;
//     }
//     if (defined(source) && defined(source.dataset) && source.dataset.hasTimeData()) {
//         var newClock = new DataSourceClock();
//         newClock.startTime = source.dataset.getTimeMinValue();
//         newClock.stopTime = source.dataset.getTimeMaxValue();
//         newClock.currentTime = newClock.startTime;
//         newClock.multiplier = JulianDate.secondsDifference(newClock.stopTime, newClock.startTime) / 60;
//         return newClock;
//     }
//     return undefined;
// }

// function finishTableLoad(csvItem) {
//     csvItem.clock = initClockFromDataSource(csvItem);
//     initCsvDataset(csvItem);
//     //prepare visuals and repaint
//     if (!defined(csvItem.rectangle)) {
//         csvItem.rectangle = csvItem._tableDataSource.dataset.getExtent();
//     }
//     csvItem.legendUrl = csvItem._tableDataSource.getLegendGraphic();
//     csvItem.terria.currentViewer.notifyRepaintRequired();
// }

// function loadTable(csvItem, text) {

//     if (defined(csvItem._tableStyle)) {
//         // sets .dataVariable and .regionVariable if they were provided.
//         csvItem._tableDataSource.setDisplayStyle(csvItem._tableStyle);
//     }

//     csvItem._tableDataSource.loadText(text);
//     var dataset = csvItem._tableDataSource.dataset;
//     // If there is specifically a 'lat' and 'lon' column.
//     if (dataset.hasLocationData()) {
//         if (!defined(csvItem._tableStyle.dataVariable)) {
//             csvItem._tableStyle.dataVariable = chooseDataVariable(csvItem);
//         }
//         finishTableLoad(csvItem);
//         return;
//     }
//     console.log('No lat&lon columns found in csv file - trying to match based on region');
//     return RegionProviderList.fromUrl(csvItem.terria.regionMappingDefinitionsUrl)
//         .then(function(rm) {
//             if (dataset.checkForRegionVariable(rm)) {
//                 return updateTableStyle(csvItem, initRegionMapStyle(csvItem, rm));
//             }
//         })
//         .then(function() {
//             if (csvItem._regionMapped) {
//                 finishTableLoad(csvItem);
//                 return;
//             }
//             throw new ModelError({
//                 sender: csvItem,
//                 title: 'Unable to load CSV file',
//                 message: 'CSV files must contain either: ' +
//                          '<ul><li>&nbsp;• "lat" and "lon" fields; or</li>' +
//                          '<li>&nbsp;• a region column like "postcode" or "sa4".</li></ul><br/><br/>' +
//                          'See <a href="https://github.com/NICTA/nationalmap/wiki/csv-geo-au">the csv-geo-au</a> specification for more.'
//                 });
//         });
// }

// function chooseDataVariable(csvItem) {
//     var tds = csvItem._tableDataSource;
//     var dv = tds.dataset.getDataVariableList(true)[0];
//     if (defined(dv)) {
//         tds.setDataVariable(dv);
//     }
//     return dv;
// }

module.exports = DataCatalogItem;
