import i18next from "i18next";
import { computed, makeObservable, override } from "mobx";
import { Axis } from "cesium";
import { Cartesian3 } from "cesium";
import { HeadingPitchRoll } from "cesium";
import { Quaternion } from "cesium";
import { Transforms } from "cesium";
import { ConstantPositionProperty } from "cesium";
import { ConstantProperty } from "cesium";
import { CustomDataSource } from "cesium";
import { Entity } from "cesium";
import { ModelGraphics } from "cesium";
import { HeightReference } from "cesium";
import AbstractConstructor from "../Core/AbstractConstructor";
import proxyCatalogItemUrl from "../Models/Catalog/proxyCatalogItemUrl";
import Model from "../Models/Definition/Model";
import GltfTraits from "../Traits/TraitsClasses/GltfTraits";
import CatalogMemberMixin from "./CatalogMemberMixin";
import MappableMixin from "./MappableMixin";
import ShadowMixin from "./ShadowMixin";

type BaseType = Model<GltfTraits>;

export interface GltfTransformationJson {
  origin: {
    latitude?: number;
    longitude?: number;
    height?: number;
  };
  rotation: {
    heading?: number;
    pitch?: number;
    roll?: number;
  };
  scale?: number;
}

function GltfMixin<T extends AbstractConstructor<BaseType>>(Base: T) {
  abstract class GltfMixin extends ShadowMixin(
    CatalogMemberMixin(MappableMixin(Base))
  ) {
    // Create stable instances of DataSource and Entity instead
    // of generating a new one each time the traits change and mobx recomputes.
    // This vastly improves the performance.
    //
    // Note that these are private instances and must not be modified outside the Mixin
    readonly _private_dataSource = new CustomDataSource("glTF Model");
    readonly _private_modelEntity = new Entity({ name: "glTF Model Entity" });

    constructor(...args: any[]) {
      super(...args);
      makeObservable(this);
    }

    get hasGltfMixin() {
      return true;
    }

    @override
    get disableZoomTo() {
      const { latitude, longitude, height } = this.origin;
      return (
        latitude === undefined ||
        longitude === undefined ||
        height === undefined
      );
    }

    @computed
    get cesiumUpAxis() {
      if (this.upAxis === undefined) {
        return Axis.Y;
      }
      return Axis.fromName(this.upAxis);
    }

    @computed
    get cesiumForwardAxis() {
      if (this.forwardAxis === undefined) {
        return Axis.Z;
      }
      return Axis.fromName(this.forwardAxis);
    }

    @computed
    get _private_cesiumHeightReference() {
      const heightReference: HeightReference =
        // @ts-ignore
        HeightReference[this.heightReference] || HeightReference.NONE;
      return heightReference;
    }

    @computed
    get cesiumPosition(): Cartesian3 {
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
    get cesiumRotation(): Quaternion {
      const { heading = 0, pitch = 0, roll = 0 } = this.rotation;
      const hpr = HeadingPitchRoll.fromDegrees(heading, pitch, roll);
      const rotation = Transforms.headingPitchRollQuaternion(
        this.cesiumPosition,
        hpr
      );
      return rotation;
    }

    @computed
    get transformationJson(): GltfTransformationJson {
      return {
        origin: {
          latitude: this.origin.latitude,
          longitude: this.origin.longitude,
          height: this.origin.height
        },
        rotation: {
          heading: this.rotation.heading,
          pitch: this.rotation.pitch,
          roll: this.rotation.roll
        },
        scale: this.scale
      };
    }

    abstract get _protected_gltfModelUrl(): string | undefined;

    @computed
    get _private_modelGraphics() {
      if (this._protected_gltfModelUrl === undefined) {
        return undefined;
      }
      const options = {
        uri: new ConstantProperty(
          proxyCatalogItemUrl(this, this._protected_gltfModelUrl)
        ),
        upAxis: new ConstantProperty(this.cesiumUpAxis),
        forwardAxis: new ConstantProperty(this.cesiumForwardAxis),
        scale: new ConstantProperty(this.scale !== undefined ? this.scale : 1),
        shadows: new ConstantProperty(this.cesiumShadows),
        heightReference: new ConstantProperty(
          this._private_cesiumHeightReference
        )
      };
      return new ModelGraphics(options);
    }

    _protected_forceLoadMetadata(): Promise<void> {
      return Promise.resolve();
    }

    override _protected_forceLoadMapItems(): Promise<void> {
      return Promise.resolve();
    }

    @override
    get shortReport(): string | undefined {
      if (this.terria.currentViewer.type === "Leaflet") {
        return i18next.t("models.commonModelErrors.3dTypeIn2dMode", this);
      }
      return super.shortReport;
    }

    @computed
    get modelEntity(): Entity {
      const entity = this._private_modelEntity;
      entity.position = new ConstantPositionProperty(this.cesiumPosition);
      entity.orientation = new ConstantProperty(this.cesiumRotation);
      entity.model = this._private_modelGraphics;
      return entity;
    }

    @computed
    get mapItems() {
      const modelEntity = this.modelEntity;
      const _private_modelGraphics = this._private_modelGraphics;
      const dataSource = this._private_dataSource;
      if (_private_modelGraphics === undefined) {
        return [];
      }

      dataSource.show = this.show;
      if (_private_modelGraphics)
        _private_modelGraphics.show = new ConstantProperty(this.show);
      if (this.name) {
        dataSource.name = this.name;
        modelEntity.name = this.name;
      }
      if (!dataSource.entities.contains(modelEntity)) {
        dataSource.entities.add(modelEntity);
      }
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
