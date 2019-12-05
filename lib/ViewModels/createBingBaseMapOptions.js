"use strict";

/*global require*/
const BaseMapViewModel = require("./BaseMapViewModel");
const BingMapsCatalogItem = require("../Models/BingMapsCatalogItem");
const BingMapsStyle = require("terriajs-cesium/Source/Scene/BingMapsStyle")
  .default;
const IonImageryCatalogItem = require("../Models/IonImageryCatalogItem");
const IonWorldImageryStyle = require("terriajs-cesium/Source/Scene/IonWorldImageryStyle")
  .default;

function createBingBaseMapOptions(terria, bingMapsKey) {
  const result = [];

  let bingMapsAerialWithLabels;
  let bingMapsAerial;
  let bingMapsRoads;

  if (bingMapsKey && terria.configParameters.useCesiumIonBingImagery !== true) {
    bingMapsAerialWithLabels = new BingMapsCatalogItem(terria);
    bingMapsAerialWithLabels.mapStyle =
      BingMapsStyle.AERIAL_WITH_LABELS_ON_DEMAND;
    bingMapsAerialWithLabels.key = bingMapsKey;

    bingMapsAerial = new BingMapsCatalogItem(terria);
    bingMapsAerial.mapStyle = BingMapsStyle.AERIAL;
    bingMapsAerial.key = bingMapsKey;

    bingMapsRoads = new BingMapsCatalogItem(terria);
    bingMapsRoads.mapStyle = BingMapsStyle.ROAD_ON_DEMAND;
    bingMapsRoads.key = bingMapsKey;
  } else if (terria.configParameters.useCesiumIonBingImagery !== false) {
    bingMapsAerialWithLabels = new IonImageryCatalogItem(terria);
    bingMapsAerialWithLabels.ionAssetId =
      IonWorldImageryStyle.AERIAL_WITH_LABELS;

    bingMapsAerial = new IonImageryCatalogItem(terria);
    bingMapsAerial.ionAssetId = IonWorldImageryStyle.AERIAL;

    bingMapsRoads = new IonImageryCatalogItem(terria);
    bingMapsRoads.ionAssetId = IonWorldImageryStyle.ROAD;
  } else {
    // Disable the Bing Maps layers entirely.
    return result;
  }

  bingMapsAerialWithLabels.name = "Bing Maps Aerial with Labels";
  bingMapsAerialWithLabels.opacity = 1.0;
  bingMapsAerialWithLabels.isRequiredForRendering = true;

  result.push(
    new BaseMapViewModel({
      image: require("../../wwwroot/images/bing-aerial-labels.png"),
      catalogItem: bingMapsAerialWithLabels
    })
  );

  bingMapsAerial.name = "Bing Maps Aerial";
  bingMapsAerial.opacity = 1.0;
  bingMapsAerial.isRequiredForRendering = true;

  result.push(
    new BaseMapViewModel({
      image: require("../../wwwroot/images/bing-aerial.png"),
      catalogItem: bingMapsAerial
    })
  );

  bingMapsRoads.name = "Bing Maps Roads";
  bingMapsRoads.opacity = 1.0;
  bingMapsRoads.isRequiredForRendering = true;

  result.push(
    new BaseMapViewModel({
      image: require("../../wwwroot/images/bing-maps-roads.png"),
      catalogItem: bingMapsRoads,
      contrastColor: "#000000"
    })
  );

  return result;
}

module.exports = createBingBaseMapOptions;
