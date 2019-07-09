import BingMapsStyle from "terriajs-cesium/Source/Scene/BingMapsStyle";
import BingMapsCatalogItem from "../Models/BingMapsCatalogItem";
import Terria from "../Models/Terria";
import { BaseMapViewModel } from "./BaseMapViewModel";
import CommonStrata from "../Models/CommonStrata";
import IonImageryCatalogItem from "../Models/IonImageryCatalogItem";
import IonWorldImageryStyle from "terriajs-cesium/Source/Scene/IonWorldImageryStyle";
import { runInAction } from "mobx";

export default function createBingBaseMapOptions(
  terria: Terria,
  bingMapsKey: string | undefined
) {
  const result: BaseMapViewModel[] = [];

  let bingMapsAerialWithLabels;
  let bingMapsAerial;
  let bingMapsRoads;

  let params = {
    terria: terria,
    opacity: 1.0,
    bingMapsKey: bingMapsKey
  };

  if (bingMapsKey && terria.configParameters.useCesiumIonBingImagery !== true) {
    params = {
      bingMapsKey: bingMapsKey,
      ...params
    };
    bingMapsAerialWithLabels = createBingMapsCatalogItem({
      id: "basemap-bing-aerial-with-labels",
      name: "Bing Maps Aerial with Labels",
      mapStyle: BingMapsStyle.AERIAL_WITH_LABELS_ON_DEMAND,
      ...params
    });

    bingMapsAerial = createBingMapsCatalogItem({
      id: "basemap-bing-aerial",
      name: "Bing Maps Aerial",
      mapStyle: BingMapsStyle.AERIAL,
      ...params
    });

    bingMapsRoads = createBingMapsCatalogItem({
      id: "basemap-bing-roads",
      name: "Bing Maps Roads",
      mapStyle: BingMapsStyle.ROAD_ON_DEMAND,
      ...params
    });
  } else if (terria.configParameters.useCesiumIonBingImagery !== false) {
    bingMapsAerialWithLabels = createIonCatalogItem({
      id: "basemap-bing-aerial-with-labels",
      name: "Bing Maps Aerial with Labels",
      assetId: IonWorldImageryStyle.AERIAL_WITH_LABELS,
      ...params
    });
    bingMapsAerial = createIonCatalogItem({
      id: "basemap-bing-aerial",
      name: "Bing Maps Aerial",
      assetId: IonWorldImageryStyle.AERIAL,
      ...params
    });

    bingMapsRoads = createIonCatalogItem({
      id: "basemap-bing-road",
      name: "Bing Maps Roads",
      assetId: IonWorldImageryStyle.ROAD,
      ...params
    });
  } else {
    // Disable the Bing Maps layers entirely.
    return result;
  }

  result.push(
    new BaseMapViewModel(
      bingMapsAerialWithLabels,
      require("../../wwwroot/images/bing-aerial-labels.png")
    )
  );
  result.push(
    new BaseMapViewModel(
      bingMapsAerial,
      require("../../wwwroot/images/bing-aerial.png")
    )
  );
  result.push(
    new BaseMapViewModel(
      bingMapsRoads,
      require("../../wwwroot/images/bing-maps-roads.png")
    )
  );

  return result;
}

function createBingMapsCatalogItem(params: {
  terria: Terria;
  id: string;
  name: string;
  mapStyle: BingMapsStyle;
  bingMapsKey?: string;
  opacity: number;
}) {
  const item = new BingMapsCatalogItem(params.id, params.terria);
  runInAction(() => {
    item.setTrait(CommonStrata.user, "name", params.name);
    item.setTrait(CommonStrata.user, "mapStyle", params.mapStyle);
    item.setTrait(CommonStrata.user, "key", params.bingMapsKey);
    item.setTrait(CommonStrata.user, "opacity", params.opacity);
  });
  return item;
}

function createIonCatalogItem(params: {
  terria: Terria;
  id: string;
  name: string;
  assetId: IonWorldImageryStyle;
  opacity: number;
}) {
  const item = new IonImageryCatalogItem(params.id, params.terria);
  runInAction(() => {
    item.setTrait(CommonStrata.user, "name", params.name);
    item.setTrait(CommonStrata.user, "ionAssetId", params.assetId);
    item.setTrait(CommonStrata.user, "opacity", params.opacity);
  });
  return item;
}
