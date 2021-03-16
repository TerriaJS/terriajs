"use strict";

import WebMapServiceCatalogItem from "../Models/WebMapServiceCatalogItem";
import CommonStrata from "../Models/CommonStrata";
import Terria from "../Models/Terria";
import { BaseMapViewModel } from "./BaseMapViewModel";
import createBingBaseMapOptions from "./createBingBaseMapOptions";
import OpenStreetMapCatalogItem from "../Models/OpenStreetMapCatalogItem";
import { runInAction } from "mobx";

export const POSITRON_BASE_MAP_ID = "basemap-positron";

export default function createGlobalBaseMapOptions(
  terria: Terria,
  bingMapsKey: string
) {
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
  });
  result.push(
    new BaseMapViewModel(
      blackMarble,
      require("../../wwwroot/images/black-marble.png")
    )
  );

  const positron = new OpenStreetMapCatalogItem(POSITRON_BASE_MAP_ID, terria);
  runInAction(() => {
    positron.setTrait(CommonStrata.user, "name", "Positron (Light)");
    positron.setTrait(
      CommonStrata.user,
      "url",
      "https://basemaps.cartocdn.com/light_all/"
    );

    // https://github.com/CartoDB/basemap-styles#1-web-raster-basemaps gives the following attribution string.
    // '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy;
    //   <a href="http://carto.com/attributions">Carto</a>'
    positron.setTrait(
      CommonStrata.user,
      "attribution",
      "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>, © <a href='https://carto.com/about-carto/'>CARTO</a>"
    );

    positron.setTrait(CommonStrata.user, "opacity", 1.0);
    positron.setTrait(CommonStrata.user, "subdomains", ["a", "b", "c", "d"]);
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
      "https://basemaps.cartocdn.com/dark_all/"
    );
    darkMatter.setTrait(
      CommonStrata.user,
      "attribution",
      "© <a href'https://www.openstreetmap.org/copyright'>OpenStreetMap</a>, © <a href='https://carto.com/about-carto/'>CARTO</a>"
    );
    darkMatter.setTrait(CommonStrata.user, "opacity", 1.0);
    darkMatter.setTrait(CommonStrata.user, "subdomains", ["a", "b", "c", "d"]);
  });

  result.push(
    new BaseMapViewModel(
      darkMatter,
      require("../../wwwroot/images/dark-matter.png")
    )
  );

  return result;
}
