import i18next from "i18next";
import { computed } from "mobx";
import { Cartesian3 as Cartesian3 } from "cesium";
import { HeadingPitchRoll as HeadingPitchRoll } from "cesium";
import { Quaternion as Quaternion } from "cesium";
import { Transforms as Transforms } from "cesium";
import { ConstantPositionProperty as ConstantPositionProperty } from "cesium";
import { ConstantProperty as ConstantProperty } from "cesium";
import { CustomDataSource as CustomDataSource } from "cesium";
import { Entity as Entity } from "cesium";
import { ModelGraphics as ModelGraphics } from "cesium";
import { HeightReference as HeightReference } from "cesium";
import { Axis } from "cesium";
import Constructor from "../Core/Constructor";
import Model from "../Models/Definition/Model";
import GltfTraits from "../Traits/TraitsClasses/GltfTraits";
import CatalogMemberMixin from "./CatalogMemberMixin";
import MappableMixin from "./MappableMixin";
import ShadowMixin from "./ShadowMixin";
import proxyCatalogItemUrl from "../Models/Catalog/proxyCatalogItemUrl";

type GltfModel = Model<GltfTraits>;

function GltfMixin<T extends Constructor<GltfModel>>(Base: T) {
  abstract class GltfMixin extends ShadowMixin(
    CatalogMemberMixin(MappableMixin(Base))
  ) {
    get hasGltfMixin() {
      return true;
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

    protected abstract get gltfModelUrl(): string | undefined;

    @computed
    private get model() {
      if (this.gltfModelUrl === undefined) {
        return undefined;
      }
      const options = {
        uri: new ConstantProperty(proxyCatalogItemUrl(this, this.gltfModelUrl)),
        upAxis: new ConstantProperty(this.cesiumUpAxis),
        forwardAxis: new ConstantProperty(this.cesiumForwardAxis),
        scale: new ConstantProperty(this.scale !== undefined ? this.scale : 1),
        shadows: new ConstantProperty(this.cesiumShadows),
        heightReference: new ConstantProperty(this.cesiumHeightReference)
      };
      return new ModelGraphics(options);
    }

    protected forceLoadMetadata(): Promise<void> {
      return Promise.resolve();
    }

    protected forceLoadMapItems(): Promise<void> {
      return Promise.resolve();
    }

    @computed
    get shortReport(): string | undefined {
      if (this.terria.currentViewer.type === "Leaflet") {
        return i18next.t("models.commonModelErrors.3dTypeIn2dMode", this);
      }
      return super.shortReport;
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
  }

  return GltfMixin;
}

namespace GltfMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof GltfMixin>> {}
  export function isMixedInto(model: any): model is Instance {
    return model && model.hasGltfMixin;
  }
}

export default GltfMixin;
