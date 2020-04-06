"use strict";

/*global require*/
var defined = require("terriajs-cesium/Source/Core/defined").default;
var GeoJsonCatalogItem = require("./GeoJsonCatalogItem");

/**
 * Updates the {@link CatalogItem#rectangle} property of a {@link CatalogItem} to be the bounding rectangle
 * of a given region.
 * @param {CatalogItem} catalogItem The catalog item to update.
 * @param {RegionProvider} regionProvider The region provider.
 * @param {Object} region The region from which to update the rectangle.  The region must be known to the region provider.
 * @return {Promise} A promise that resolves when the rectangle has been updated.  This promise silently resolves
 *                   if an error occurs while trying to update the rectangle.
 */
var updateRectangleFromRegion = function(catalogItem, regionProvider, region) {
  return regionProvider
    .getRegionFeature(catalogItem.terria, region)
    .then(function(feature) {
      if (defined(feature) && feature.type === "Feature") {
        var geojsonCatalogItem = new GeoJsonCatalogItem(catalogItem.terria);
        geojsonCatalogItem.data = feature;
        return geojsonCatalogItem.load().then(function() {
          catalogItem.rectangle = geojsonCatalogItem.rectangle;
        });
      }
    })
    .otherwise(function() {});
};

module.exports = updateRectangleFromRegion;
