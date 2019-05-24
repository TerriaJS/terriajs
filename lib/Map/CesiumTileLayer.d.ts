import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import { ProviderCoords } from "./PickedFeatures";
import ImagerySplitDirection from "terriajs-cesium/Source/Scene/ImagerySplitDirection";

export = CesiumTileLayer;

declare class CesiumTileLayer extends L.TileLayer {
  imageryProvider: ImageryProvider;
  splitDirection?: ImagerySplitDirection;

  constructor(
    imageryProvider: Cesium.ImageryProvider,
    options?: L.TileLayerOptions
  );

  getFeaturePickingCoords(
    map: L.Map,
    longitudeRadians: number,
    latitudeRadians: number
  ): Promise<ProviderCoords>;
  pickFeatures(
    x: number,
    y: number,
    level: number,
    longitudeRadians: number,
    latitudeRadians: number
  ): Promise<ImageryLayerFeatureInfo[]>;
}
