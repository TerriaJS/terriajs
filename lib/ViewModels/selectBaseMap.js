"use strict";

/*global require*/
var defined = require("terriajs-cesium/Source/Core/defined").default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;

/**
 * Selects a base map by name from a list of base map options.  The name is specified by `terria.baseMapName`, or,
 * if that property is undefined, by the specified `defaultBaseMapName`.  In addition to setting `terria.baseMap`,
 * this function subscribes to be notified when `terria.baseMapName` changes and updates `terria.baseMap`
 * accordingly.  If a base map with the name is not in the `baseMaps` list, this method leaves the
 * `terria.baseMap` property unmodified.
 *
 * @param {Terria} terria The TerriaJS application.
 * @param {BaseMapViewModel[]} baseMaps The list of possible base maps.
 * @param {string} defaultBaseMapName The name of the base map to search for.
 * @param {boolean} useStoredPreference If true, look for and use a localStorage preference instead.
 * @returns {BaseMapViewModel} The matching base map, or undefined if not found.
 */
var selectBaseMap = function(
  terria,
  baseMaps,
  defaultBaseMapName,
  useStoredPreference
) {
  function updateBaseMap(baseMapName) {
    if (!defined(baseMapName)) {
      return undefined;
    }

    for (var i = 0; i < baseMaps.length; ++i) {
      if (baseMaps[i].catalogItem.name === baseMapName) {
        terria.baseMap = baseMaps[i].catalogItem;
        terria.baseMapContrastColor = baseMaps[i].contrastColor;
        return terria.baseMap;
      }
    }
    return undefined;
  }

  knockout.getObservable(terria, "baseMapName").subscribe(function() {
    updateBaseMap(terria.baseMapName);
  });

  if (baseMaps.length === 0) {
    return undefined;
  }

  var baseMap;
  if (useStoredPreference) {
    baseMap = updateBaseMap(terria.getLocalProperty("basemap"));
  }
  baseMap =
    baseMap ||
    updateBaseMap(terria.baseMapName) ||
    updateBaseMap(defaultBaseMapName) ||
    updateBaseMap(baseMaps[0].catalogItem.name);
  return baseMap;
};

module.exports = selectBaseMap;
