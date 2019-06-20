import primitiveTrait from "../Traits/primitiveTrait";
import mixTraits from "../Traits/mixTraits";
import UrlTraits from "../Traits/UrlTraits";
import MappableTraits from "../Traits/MappableTraits";
import CatalogMemberTraits from "../Traits/CatalogMemberTraits";
import UrlMixin from "../ModelMixins/UrlMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import CreateModel from "./CreateModel";
import objectTrait from "../Traits/objectTrait";
import ModelTraits from "../Traits/ModelTraits";
import Mappable from "./Mappable";
import { computed } from "mobx";
import CesiumModel from "terriajs-cesium/Source/Scene/Model";
import Transforms from "terriajs-cesium/Source/Core/Transforms";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";

class LatLonHeightTraits extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "Latitude",
    description: "Latitude in degrees"
  })
  latitude?: number;

  @primitiveTrait({
    type: "number",
    name: "Longitude",
    description: "Longitude in degrees"
  })
  longitude?: number;

  @primitiveTrait({
    type: "number",
    name: "Height",
    description: "Height above ellipsoid in metres"
  })
  height?: number;
}

export class GltfCatalogItemTraits extends mixTraits(
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits
) {
  @objectTrait({
    type: LatLonHeightTraits,
    name: "Origin",
    description:
      "The origin of the model, expressed as a longitude and latitude in degrees and a height in meters. If this property is specified, the model's axes will have X pointing East, Y pointing North, and Z pointing Up. If not specified, the model is located in the Earth-Centered Earth-Fixed frame."
  })
  origin?: LatLonHeightTraits;
}

export default class GltfCatalogItem
  extends UrlMixin(CatalogMemberMixin(CreateModel(GltfCatalogItemTraits)))
  implements Mappable {
  static readonly type = "gltf";
  get type() {
    return GltfCatalogItem.type;
  }

  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }
  loadMapItems(): Promise<void> {
    return Promise.resolve();
  }

  @computed
  private get _model(): CesiumModel | undefined {
    if (this.url === undefined) {
      return undefined;
    }
    let modelMatrix;
    if (
      this.origin &&
      this.origin.longitude &&
      this.origin.latitude &&
      this.origin.height
    ) {
      const origin = Cartesian3.fromDegrees(
        this.origin.longitude,
        this.origin.latitude,
        this.origin.height
      );
      modelMatrix = Transforms.eastNorthUpToFixedFrame(origin);
    }
    const options = {
      url: this.url,
      modelMatrix: modelMatrix,
      upAxis: "Z",
      forwardAxis: "X"
      //shadows: this._cesiumShadows
    };

    var model = CesiumModel.fromGltf(options);
    // (model as any)._catalogItem = this;

    // this._subscriptions.push(
    //   knockout.getObservable(this, "_cesiumShadows").subscribe(value => {
    //     this._model.shadows = this._cesiumShadows;
    //   })
    // );
    return model;
  }

  @computed
  get mapItems(): CesiumModel[] {
    const model = this._model;
    if (model === undefined) {
      return [];
    }
    model.show = this.show;
    // Also shadows
    return [model];
  }
}
