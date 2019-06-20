import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import "terriajs-cesium/Source/Scene/ImageryProvider";
import CesiumModel from "terriajs-cesium/Source/Scene/Model";
import MappableTraits from "../Traits/MappableTraits";
import Model, { BaseModel } from "./Model";

// Shouldn't this be a class?
export interface ImageryParts {
  // TODO
  readonly alpha: number;
  // wms: boolean;
  // isGeoServer: boolean;
  readonly show: boolean;
  readonly imageryProvider: Cesium.ImageryProvider;
}

// This discriminator only discriminates between ImageryParts and DataSource
export namespace ImageryParts {
  export function is(
    object: DataSource | ImageryParts | CesiumModel
  ): object is ImageryParts {
    return "imageryProvider" in object;
  }
}

export function isDataSource(
  object: DataSource | ImageryParts | CesiumModel
): object is DataSource {
  return "entities" in object;
}

export function isCesiumModel(
  object: DataSource | ImageryParts | CesiumModel
): object is CesiumModel {
  return "gltf" in object;
}

interface Mappable extends Model<MappableTraits> {
  readonly mapItems: ReadonlyArray<DataSource | ImageryParts | CesiumModel>;
  loadMapItems(): Promise<void>;
}

namespace Mappable {
  export function is(model: BaseModel | Mappable): model is Mappable {
    return "mapItems" in model;
  }
}

export default Mappable;
