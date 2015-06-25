'use strict';

/*global require*/
var Cartesian3 = require('terriajs-cesium/Source/Core/Cartesian3');
var clone = require('terriajs-cesium/Source/Core/clone');
var CustomDataSource = require('terriajs-cesium/Source/DataSources/CustomDataSource');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var sampleTerrain = require('terriajs-cesium/Source/Core/sampleTerrain');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var inherit = require('../Core/inherit');
var CatalogItem = require('./CatalogItem');
var lowestTerrainLevel = require('../Map/lowestTerrainLevel');


/**
 * A {@link CatalogItem} that is represented on the map with a billboard at the center
 * of the item's rectangle.
 *
 * @alias BillboardCatalogItem
 * @constructor
 * @extends CatalogItem
 *
 * @param {Terria} terria The terria instance.
 * @param {Billboard} billboard The billboard to be displayed on the map or globe.
 */
var BillboardCatalogItem = function(terria, billboard) {
    CatalogItem.call(this, terria);

    this.billboard = billboard;

    this._entity = undefined;

    this._dataSource = undefined;

    knockout.getObservable(this.terria, 'pickedFeatures').subscribe(function(picked) {
        var that = this;

        when(picked.allFeaturesAvailablePromise, function() {
            var features = picked.features;
            for (var i = 0; i < features.length; i++) {
                var feature = features[i];
                if (feature === that._entity) {
                    that.billboardClicked();
                }
            }
        });

    }, this);
};

inherit(CatalogItem, BillboardCatalogItem);

defineProperties(BillboardCatalogItem.prototype, {

    /**
     * Gets the type of data item represented by this instance.
     * @memberOf BillboardCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'billboard';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Billboard Item'.
     * @memberOf BillboardCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Billboard Item';
        }
    },

    /**
     * Gets the entity used to display this data item.
     * @memberOf BillboardCatalogItem.prototype
     * @type {Entity}
     */
    entity : {
        get : function() {
            return this._entity;
        }
    },

    /**
     * Gets the data source used to display this data item.
     * @memberOf BillboardCatalogItem.prototype
     * @type {DataSource}
     */
    dataSource : {
        get : function() {
            return this._dataSource;
        }
    },

});

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived object with the
 * `serializeForSharing` flag set in the options.
 * @type {String[]}
 */
CatalogItem.defaultPropertiesForSharing = clone(CatalogItem.defaultPropertiesForSharing);
CatalogItem.defaultPropertiesForSharing.push('billboard');
freezeObject(CatalogItem.defaultPropertiesForSharing);

/**
 * Enables this data item on the globe or map.
 * @protected
 */
CatalogItem.prototype._enable = function() {

    var cartographic = Rectangle.center(this.rectangle);
    var cartesian = Ellipsoid.WGS84.cartographicToCartesian(cartographic);

    var entity = {
        billboard: this.billboard,
        position: cartesian,
        name: this.name
    };

    this._dataSource = new CustomDataSource(this.name);
    this._entity = this.dataSource.entities.add(entity);

    if (defined(this.terria.cesium)) {
        this.terria.cesium.stoppedRendering = true;

        _updateHeightFromTerrain(
            this._entity,
            this.terria.cesium.viewer.terrainProvider,
            cartographic
        );
    }
};

/**
 * Disables this data item on the globe or map.
 * @protected
 */
CatalogItem.prototype._disable = function() {
    this._entity = undefined;
    this._dataSource = undefined;
};

/**
 * Shows this data item on the globe or map.
 * @protected
 */
CatalogItem.prototype._show = function() {
    this.terria.dataSources.add(this.dataSource);
};

/**
 * Hides this data item on the globe or map.
 * @protected
 */
CatalogItem.prototype._hide = function() {
    this.terria.dataSources.remove(this.dataSource);
};

CatalogItem.prototype._enableInCesium = function() {
};

CatalogItem.prototype._disableInCesium = function() {
};

CatalogItem.prototype._showInCesium = function() {
};

CatalogItem.prototype._hideInCesium = function() {
};

CatalogItem.prototype._enableInLeaflet = function() {
};

CatalogItem.prototype._disableInLeaflet = function() {
};

CatalogItem.prototype._showInLeaflet = function() {
};

CatalogItem.prototype._hideInLeaflet = function() {
};

/**
 * When implemented in a derived class, is the function called when the billboard is clicked
 * @abstract
 * @protected
 */
CatalogItem.prototype.billboardClicked = function(data) {

};

/**
 * Finds the height from the terrain at the position of the billboard and updates the
 * billboard's position accodingly.
 * @protected
 */
function _updateHeightFromTerrain(entity, terrainProvider, position) {
    var levelPromise = lowestTerrainLevel(position, terrainProvider);

    return when(levelPromise, function(level){
        var terrainPromise = sampleTerrain(terrainProvider,level,[position]);

        return when(terrainPromise, function(newPos) {
            var cartPos = Cartesian3.fromRadians(newPos[0].longitude,newPos[0].latitude,newPos[0].height);
            entity.position.setValue(cartPos);
        });
    });
}

module.exports = BillboardCatalogItem;
