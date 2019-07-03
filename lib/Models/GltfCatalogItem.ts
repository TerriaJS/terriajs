import { computed } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import ConstantProperty from "terriajs-cesium/Source/DataSources/ConstantProperty";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import ModelGraphics from "terriajs-cesium/Source/DataSources/ModelGraphics";
import Axis from "terriajs-cesium/Source/Scene/Axis";
import ShadowMode from "terriajs-cesium/Source/Scene/ShadowMode";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import CatalogMemberTraits from "../Traits/CatalogMemberTraits";
import MappableTraits from "../Traits/MappableTraits";
import mixTraits from "../Traits/mixTraits";
import ModelTraits from "../Traits/ModelTraits";
import objectTrait from "../Traits/objectTrait";
import primitiveTrait from "../Traits/primitiveTrait";
import UrlTraits from "../Traits/UrlTraits";
import CreateModel from "./CreateModel";
import Mappable from "./Mappable";

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

  @primitiveTrait({
    type: "string",
    name: "Up axis",
    description:
      "The model's up-axis. By default models are y-up according to the glTF spec, however geo-referenced models will typically be z-up. Valid values are 'X', 'Y', or 'Z'."
  })
  upAxis?: string;

  @primitiveTrait({
    type: "string",
    name: "Forward axis",
    description:
      "The model's forward axis. By default, glTF 2.0 models are Z-forward according to the glTF spec, however older glTF (1.0, 0.8) models used X-forward. Valid values are 'X' or 'Z'."
  })
  forwardAxis?: string;

  @primitiveTrait({
    type: "number",
    name: "Scale",
    description: "The scale factor to apply to the model"
  })
  scale?: number;

  @primitiveTrait({
    type: "string",
    name: "Shadows",
    description:
      'Indicates whether this tileset casts and receives shadows. Valid values are "NONE", "BOTH", "CAST", and "RECEIVE".'
  })
  shadows?: string;
}

export default class GltfCatalogItem
  extends UrlMixin(CatalogMemberMixin(CreateModel(GltfCatalogItemTraits)))
  implements Mappable {
  static readonly type = "gltf";

  get type() {
    return GltfCatalogItem.type;
  }

  get isMappable() {
    return true;
  }

  get canZoomTo() {
    return true;
  }

  @computed
  private get _cesiumUpAxis() {
    if (this.upAxis === undefined) {
      return Axis.Z;
    }
    return Axis.fromName(this.upAxis);
  }

  @computed
  private get _cesiumForwardAxis() {
    if (this.forwardAxis === undefined) {
      return Axis.X;
    }
    return Axis.fromName(this.forwardAxis);
  }

  @computed
  private get _cesiumShadows() {
    let result;

    switch (this.shadows !== undefined ? this.shadows.toLowerCase() : "none") {
      case "none":
        result = ShadowMode.DISABLED;
        break;
      case "both":
        result = ShadowMode.ENABLED;
        break;
      case "cast":
        result = ShadowMode.CAST_ONLY;
        break;
      case "receive":
        result = ShadowMode.RECEIVE_ONLY;
        break;
      default:
        result = ShadowMode.DISABLED;
        break;
    }
    return result;
  }

  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }
  loadMapItems(): Promise<void> {
    return Promise.resolve();
  }

  @computed
  private get _model() {
    if (this.url === undefined) {
      return undefined;
    }
    const options = {
      uri: this.url,
      upAxis: this._cesiumUpAxis,
      forwardAxis: this._cesiumForwardAxis,
      scale: this.scale !== undefined ? this.scale : 1,
      shadows: new ConstantProperty(this._cesiumShadows)
    };

    return new ModelGraphics(options);
  }

  @computed
  get mapItems() {
    if (this._model === undefined) {
      return [];
    }
    this._model.show = this.show;

    let position;
    if (this.origin !== undefined) {
      position = Cartesian3.fromDegrees(
        this.origin.longitude || 0,
        this.origin.latitude || 0,
        this.origin.height || 0
      );
    }

    const dataSource = new CustomDataSource(this.name || "glTF model");
    dataSource.entities.add(
      new Entity({
        position,
        model: this._model
      })
    );
    return [dataSource];
  }
}
