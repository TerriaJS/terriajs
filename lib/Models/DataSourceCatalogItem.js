'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');

var CatalogItem = require('./CatalogItem');
var inherit = require('../Core/inherit');

/**
 * A {@link CatalogItem} that is added to the map as a Cesium {@link DataSource}
 *
 * @alias DataSourceCatalogItem
 * @constructor
 * @extends CatalogItem
 * @abstract
 *
 * @param {Terria} terria The Terria instance.
 */
var DataSourceCatalogItem = function(terria) {
    CatalogItem.call(this, terria);
};

inherit(CatalogItem, DataSourceCatalogItem);

defineProperties(DataSourceCatalogItem.prototype, {
    /**
     * Gets the data source associated with this catalog item.
     * @memberOf DataSourceCatalogItem.prototype
     * @type {DataSource}
     */
    dataSource : {
        get : function() {
            throw new DeveloperError('Types derived from DataSourceCatalogItem must implement a "dataSource" property.');
        }
    }
});

DataSourceCatalogItem.prototype._enable = function() {
};

DataSourceCatalogItem.prototype._disable = function() {
};

DataSourceCatalogItem.prototype._show = function() {
    if (!defined(this.dataSource)) {
        throw new DeveloperError('This data source is not loaded.');
    }

    var dataSources =  this.terria.dataSources;
    if (dataSources.contains(this.dataSource)) {
        return;
    }

    dataSources.add(this.dataSource);
};

DataSourceCatalogItem.prototype._hide = function() {
    if (!defined(this.dataSource)) {
        throw new DeveloperError('This data source is not loaded.');
    }

    var dataSources =  this.terria.dataSources;
    if (!dataSources.contains(this.dataSource)) {
        return;
    }

    dataSources.remove(this.dataSource, false);
};

DataSourceCatalogItem.prototype.showOnSeparateMap = function(globeOrMap) {
    var dataSource = this.dataSource;

    globeOrMap.addDataSource({
        dataSource: dataSource
    });

    return function() {
        globeOrMap.removeDataSource({
            dataSource: dataSource
        });
    };
};

module.exports = DataSourceCatalogItem;
