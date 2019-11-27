"use strict";

/*global require*/
var defined = require("terriajs-cesium/Source/Core/defined").default;

function setOpacity(catalogItem, layer, opacity) {
  if (!defined(layer)) {
    return;
  }

  if (defined(catalogItem.terria.cesium)) {
    layer.alpha = opacity;
  }

  if (defined(catalogItem.terria.leaflet)) {
    layer.setOpacity(opacity);
  }
}

function fixNextLayerOrder(catalogItem, layer, nextLayer) {
  if (!defined(layer) || !defined(nextLayer)) {
    return;
  }

  if (defined(catalogItem.terria.cesium)) {
    var imageryLayers = catalogItem.terria.cesium.scene.imageryLayers;

    var currentIndex = imageryLayers.indexOf(layer);
    var nextIndex = imageryLayers.indexOf(nextLayer);
    if (currentIndex < 0 || nextIndex < 0) {
      return;
    }

    while (nextIndex < currentIndex - 1) {
      imageryLayers.raise(nextLayer);
      ++nextIndex;
    }

    while (nextIndex > currentIndex + 1) {
      imageryLayers.lower(nextLayer);
      --nextIndex;
    }
  }
}

module.exports = { setOpacity, fixNextLayerOrder };
