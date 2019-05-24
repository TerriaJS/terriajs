"use strict";

/*global require*/
import WebMapServiceCatalogItem from "../Models/WebMapServiceCatalogItem";
import CommonStrata from "../Models/CommonStrata";
import Terria from "../Models/Terria";
import { BaseMapViewModel } from "./BaseMapViewModel";
// var createBingBaseMapOptions = require("./createBingBaseMapOptions");
// var OpenStreetMapCatalogItem = require("../Models/OpenStreetMapCatalogItem");

function createGlobalBaseMapOptions(terria: Terria /*, bingMapsKey*/) {
  const result = []; //createBingBaseMapOptions(terria, bingMapsKey);

  var naturalEarthII = new WebMapServiceCatalogItem(
    "basemap-natural-earth-II",
    terria
  );
  naturalEarthII.setTrait(CommonStrata.user, "name", "Natural Earth II");
  naturalEarthII.setTrait(
    CommonStrata.user,
    "url",
    "http://geoserver.nationalmap.nicta.com.au/imagery/natural-earth-ii/wms"
  );
  naturalEarthII.setTrait(
    CommonStrata.user,
    "layers",
    "natural-earth-ii:NE2_HR_LC_SR_W_DR"
  );
  // naturalEarthII.parameters = {
  //   tiled: true
  // };
  naturalEarthII.setTrait(CommonStrata.user, "opacity", 1.0);
  // naturalEarthII.isRequiredForRendering = true;
  naturalEarthII.loadMapItems();

  result.push(
    new BaseMapViewModel(
      naturalEarthII,
      require("../../wwwroot/images/natural-earth.png")
    )
  );

  const blackMarble = new WebMapServiceCatalogItem(
    "basemap-black-marble",
    terria
  );
  blackMarble.setTrait(CommonStrata.user, "name", "NASA Black Marble");
  blackMarble.setTrait(
    CommonStrata.user,
    "url",
    "http://geoserver.nationalmap.nicta.com.au/imagery/nasa-black-marble/wms"
  );
  blackMarble.setTrait(
    CommonStrata.user,
    "layers",
    "nasa-black-marble:dnb_land_ocean_ice.2012.54000x27000_geo"
  );
  blackMarble.setTrait(CommonStrata.user, "opacity", 1.0);
  blackMarble.loadMapItems();
  result.push(
    new BaseMapViewModel(
      blackMarble,
      require("../../wwwroot/images/black-marble.png")
    )
  );

  // var positron = new OpenStreetMapCatalogItem(terria);
  // positron.name = "Positron (Light)";
  // positron.url = "https://global.ssl.fastly.net/light_all/";

  // // https://cartodb.com/basemaps/ gives two different attribution strings. In any case HTML gets swallowed, so we have to adapt.
  // // 1 '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy;
  // //   <a href="http://cartodb.com/attributions">CartoDB</a>'
  // // 2 Map tiles by <a href="http://cartodb.com/attributions#basemaps">CartoDB</a>, under <a href="https://creativecommons.org/licenses/by/3.0/">
  // //   CC BY 3.0</a>. Data by <a href="http://www.openstreetmap.org/">OpenStreetMap</a>, under ODbL.
  // positron.attribution =
  //   "© OpenStreetMap contributors ODbL, © CartoDB CC-BY 3.0";

  // positron.opacity = 1.0;
  // positron.subdomains = [
  //   "cartodb-basemaps-a",
  //   "cartodb-basemaps-b",
  //   "cartodb-basemaps-c",
  //   "cartodb-basemaps-d"
  // ];
  // result.push(
  //   new BaseMapViewModel({
  //     image: require("../../wwwroot/images/positron.png"),
  //     catalogItem: positron,
  //     contrastColor: "#000000"
  //   })
  // );

  // var darkMatter = new OpenStreetMapCatalogItem(terria);
  // darkMatter.name = "Dark Matter";
  // darkMatter.url = "https://global.ssl.fastly.net/dark_all/";

  // darkMatter.attribution =
  //   "© OpenStreetMap contributors ODbL, © CartoDB CC-BY 3.0";

  // darkMatter.opacity = 1.0;
  // darkMatter.subdomains = [
  //   "cartodb-basemaps-a",
  //   "cartodb-basemaps-b",
  //   "cartodb-basemaps-c",
  //   "cartodb-basemaps-d"
  // ];
  // result.push(
  //   new BaseMapViewModel({
  //     image: require("../../wwwroot/images/dark-matter.png"),
  //     catalogItem: darkMatter
  //   })
  // );

  return result;
}

module.exports = createGlobalBaseMapOptions;
