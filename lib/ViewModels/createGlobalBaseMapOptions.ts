"use strict";

/*global require*/
import WebMapServiceCatalogItem from "../Models/WebMapServiceCatalogItem";
import CommonStrata from "../Models/CommonStrata";
import Terria from "../Models/Terria";
import { BaseMapViewModel } from "./BaseMapViewModel";
import createBingBaseMapOptions from "./createBingBaseMapOptions";
import OpenStreetMapCatalogItem from "../Models/OpenStreetMapCatalogItem";
import { runInAction } from "mobx";

function createGlobalBaseMapOptions(terria: Terria, bingMapsKey: string) {
  const result = createBingBaseMapOptions(terria, bingMapsKey);

  var naturalEarthII = new WebMapServiceCatalogItem(
    "basemap-natural-earth-II",
    terria
  );
  runInAction(() => {
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
  });

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
  runInAction(() => {
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
  });
  result.push(
    new BaseMapViewModel(
      blackMarble,
      require("../../wwwroot/images/black-marble.png")
    )
  );

  const positron = new OpenStreetMapCatalogItem("basemap-positron", terria);
  runInAction(() => {
    positron.setTrait(CommonStrata.user, "name", "Positron (Light)");
    positron.setTrait(
      CommonStrata.user,
      "url",
      "https://global.ssl.fastly.net/light_all/"
    );

    // https://cartodb.com/basemaps/ gives two different attribution strings. In any case HTML gets swallowed, so we have to adapt.
    // 1 '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy;
    //   <a href="http://cartodb.com/attributions">CartoDB</a>'
    // 2 Map tiles by <a href="http://cartodb.com/attributions#basemaps">CartoDB</a>, under <a href="https://creativecommons.org/licenses/by/3.0/">
    //   CC BY 3.0</a>. Data by <a href="http://www.openstreetmap.org/">OpenStreetMap</a>, under ODbL.
    positron.setTrait(
      CommonStrata.user,
      "attribution",
      "© OpenStreetMap contributors ODbL, © CartoDB CC-BY 3.0"
    );

    positron.setTrait(CommonStrata.user, "opacity", 1.0);
    positron.setTrait(CommonStrata.user, "subdomains", [
      "cartodb-basemaps-a",
      "cartodb-basemaps-b",
      "cartodb-basemaps-c",
      "cartodb-basemaps-d"
    ]);
  });
  result.push(
    new BaseMapViewModel(positron, require("../../wwwroot/images/positron.png"))
  );

  const darkMatter = new OpenStreetMapCatalogItem("basemap-darkmatter", terria);
  runInAction(() => {
    darkMatter.setTrait(CommonStrata.user, "name", "Dark Matter");
    darkMatter.setTrait(
      CommonStrata.user,
      "url",
      "https://global.ssl.fastly.net/dark_all/"
    );
    darkMatter.setTrait(
      CommonStrata.user,
      "attribution",
      "© OpenStreetMap contributors ODbL, © CartoDB CC-BY 3.0"
    );
    darkMatter.setTrait(CommonStrata.user, "opacity", 1.0);
    darkMatter.setTrait(CommonStrata.user, "subdomains", [
      "cartodb-basemaps-a",
      "cartodb-basemaps-b",
      "cartodb-basemaps-c",
      "cartodb-basemaps-d"
    ]);
  });

  result.push(
    new BaseMapViewModel(
      darkMatter,
      require("../../wwwroot/images/dark-matter.png")
    )
  );

  return result;
}

module.exports = createGlobalBaseMapOptions;
