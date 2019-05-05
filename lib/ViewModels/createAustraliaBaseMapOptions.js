"use strict";

/*global require*/
var ArcGisMapServerCatalogItem = require("../Models/ArcGisMapServerCatalogItem");
var BaseMapViewModel = require("./BaseMapViewModel");

var createAustraliaBaseMapOptions = function(terria) {
  var result = [];

  var australianTopo = new ArcGisMapServerCatalogItem(terria);
  australianTopo.url =
    "http://services.ga.gov.au/gis/rest/services/NationalMap_Colour_Topographic_Base_World_WM/MapServer";
  australianTopo.opacity = 1.0;
  australianTopo.isRequiredForRendering = true;
  australianTopo.name = "Australian Topography";
  australianTopo.allowFeaturePicking = false;

  result.push(
    new BaseMapViewModel({
      image: require("../../wwwroot/images/australian-topo.png"),
      catalogItem: australianTopo,
      contrastColor: "#000000"
    })
  );

  return result;
};

module.exports = createAustraliaBaseMapOptions;
