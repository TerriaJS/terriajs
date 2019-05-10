"use strict";

/*global require*/
var clone = require("terriajs-cesium/Source/Core/clone");
var defineProperties = require("terriajs-cesium/Source/Core/defineProperties");
var freezeObject = require("terriajs-cesium/Source/Core/freezeObject");

var CatalogGroup = require("./CatalogGroup");
var inherit = require("../Core/inherit");

/**
 * A {@link CatalogGroup} representing a collection of layers for charting
 *
 * @alias ChartDataGroup
 * @constructor
 * @extends CatalogGroup
 *
 * @param {Terria} terria The Terria instance.
 */
var ChartDataGroup = function(terria) {
  CatalogGroup.call(this, terria);
};

inherit(CatalogGroup, ChartDataGroup);

defineProperties(ChartDataGroup.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf ChartDataGroup.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "chartDataGroup";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, such as 'Web Map Tile Service (WMTS)'.
   * @memberOf ChartDataGroup.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return "Group for charts";
    }
  }
});

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
ChartDataGroup.defaultSerializers = clone(CatalogGroup.defaultSerializers);

ChartDataGroup.defaultSerializers.items =
  CatalogGroup.enabledShareableItemsSerializer;

ChartDataGroup.defaultSerializers.isLoading = function(
  wmtsGroup,
  json,
  propertyName,
  options
) {};

freezeObject(ChartDataGroup.defaultSerializers);

module.exports = ChartDataGroup;
