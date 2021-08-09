import { action, computed, observable } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import HeadingPitchRoll from "terriajs-cesium/Source/Core/HeadingPitchRoll";
import Quaternion from "terriajs-cesium/Source/Core/Quaternion";
import Transforms from "terriajs-cesium/Source/Core/Transforms";
import ConstantPositionProperty from "terriajs-cesium/Source/DataSources/ConstantPositionProperty";
import ConstantProperty from "terriajs-cesium/Source/DataSources/ConstantProperty";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import ModelGraphics from "terriajs-cesium/Source/DataSources/ModelGraphics";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import ShadowMixin from "../../../ModelMixins/ShadowMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import GltfCatalogItemTraits from "../../../Traits/TraitsClasses/GltfCatalogItemTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import { SelectableDimension } from "../../SelectableDimensions";

// We want TS to look at the type declared in lib/ThirdParty/terriajs-cesium-extra/index.d.ts
// and import doesn't allows us to do that, so instead we use require + type casting to ensure
// we still maintain the type checking, without TS screaming with errors
const Axis: Axis = require("terriajs-cesium/Source/Scene/Axis").default;

export default class GltfCatalogItem extends MappableMixin(
  ShadowMixin(UrlMixin(CatalogMemberMixin(CreateModel(GltfCatalogItemTraits))))
) {
  static readonly type = "gltf";

  @observable hasLocalData = false;

  get type() {
    return GltfCatalogItem.type;
  }

  @computed
  private get cesiumUpAxis() {
    if (this.upAxis === undefined) {
      return Axis.Y;
    }
    return Axis.fromName(this.upAxis);
  }

  @computed
  private get cesiumForwardAxis() {
    if (this.forwardAxis === undefined) {
      return Axis.Z;
    }
    return Axis.fromName(this.forwardAxis);
  }

  @computed
  private get cesiumHeightReference() {
    const heightReference: HeightReference =
      // @ts-ignore
      HeightReference[this.heightReference] || HeightReference.NONE;
    return heightReference;
  }

  @computed
  private get cesiumPosition(): Cartesian3 {
    if (
      this.origin !== undefined &&
      this.origin.longitude !== undefined &&
      this.origin.latitude !== undefined &&
      this.origin.height !== undefined
    ) {
      return Cartesian3.fromDegrees(
        this.origin.longitude,
        this.origin.latitude,
        this.origin.height
      );
    } else {
      return Cartesian3.ZERO;
    }
  }

  /**
   * Returns the orientation of the model in the ECEF frame
   */
  @computed
  private get orientation(): Quaternion {
    const { heading, pitch, roll } = this.rotation;
    const hpr = HeadingPitchRoll.fromDegrees(
      heading ?? 0,
      pitch ?? 0,
      roll ?? 0
    );
    const orientation = Transforms.headingPitchRollQuaternion(
      this.cesiumPosition,
      hpr
    );
    return orientation;
  }

  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }

  @action
  setFileInput(file: File | Blob) {
    const dataUrl = URL.createObjectURL(file);
    this.setTrait(CommonStrata.user, "url", dataUrl);
    this.hasLocalData = true;
  }

  @computed
  private get model() {
    if (this.url === undefined) {
      return undefined;
    }
    const options = {
      uri: new ConstantProperty(this.url),
      upAxis: new ConstantProperty(this.cesiumUpAxis),
      forwardAxis: new ConstantProperty(this.cesiumForwardAxis),
      scale: new ConstantProperty(this.scale !== undefined ? this.scale : 1),
      shadows: new ConstantProperty(this.cesiumShadows),
      heightReference: new ConstantProperty(this.cesiumHeightReference)
    };
    return new ModelGraphics(options);
  }

  protected forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }

  @computed
  get mapItems() {
    if (this.model === undefined) {
      return [];
    }

    this.model.show = new ConstantProperty(this.show);
    const dataSource: CustomDataSource = new CustomDataSource(
      this.name || "glTF model"
    );
    dataSource.entities.add(
      new Entity({
        position: new ConstantPositionProperty(this.cesiumPosition),
        orientation: new ConstantProperty(this.orientation),
        model: this.model
      })
    );
    return [dataSource];
  }

  @computed get selectableDimensions(): SelectableDimension[] {
    return [...super.selectableDimensions, this.shadowDimension];
  }
}
