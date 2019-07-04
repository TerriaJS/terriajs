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
import CreateModel from "./CreateModel";
import Mappable from "./Mappable";
import GltfCatalogItemTraits from "../Traits/GltfCatalogItemTraits";

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
