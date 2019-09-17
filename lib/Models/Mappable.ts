import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import Cesium3DTileset from "terriajs-cesium/Source/Scene/Cesium3DTileset";
import "terriajs-cesium/Source/Scene/ImageryProvider";
import TerrainProvider from "terriajs-cesium/Source/Core/TerrainProvider";
import MappableTraits from "../Traits/MappableTraits";
import Model, { BaseModel } from "./Model";

export type MapItem =
  | ImageryParts
  | DataSource
  | Cesium3DTileset
  | TerrainProvider;

// Shouldn't this be a class?
export interface ImageryParts {
  // TODO
  alpha: number;
  // wms: boolean;
  // isGeoServer: boolean;
  show: boolean;
  imageryProvider: Cesium.ImageryProvider;
}

// This discriminator only discriminates between ImageryParts and DataSource
export namespace ImageryParts {
  export function is(object: MapItem): object is ImageryParts {
    return "imageryProvider" in object;
  }
}

interface Mappable extends Model<MappableTraits> {
  readonly mapItems: ReadonlyArray<MapItem>;
  loadMapItems(): Promise<void>;
}

namespace Mappable {
  export function is(model: BaseModel | Mappable): model is Mappable {
    return "mapItems" in model;
  }
}

export function isCesium3DTileset(
  mapItem: MapItem
): mapItem is Cesium3DTileset {
  return "allTilesLoaded" in mapItem;
}

export function isTerrainProvider(
  mapItem: MapItem
): mapItem is TerrainProvider {
  return "hasVertexNormals" in mapItem;
}

export default Mappable;
