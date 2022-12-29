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
import proxyCatalogItemUrl from "../Models/Catalog/proxyCatalogItemUrl";
import Model from "../Models/Definition/Model";
import GltfTraits from "../Traits/TraitsClasses/GltfTraits";
import CatalogMemberMixin from "./CatalogMemberMixin";
import MappableMixin from "./MappableMixin";
import ShadowMixin from "./ShadowMixin";

type GltfModel = Model<GltfTraits>;

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

function GltfMixin<T extends Constructor<GltfModel>>(Base: T) {
  abstract class GltfMixin extends ShadowMixin(
    CatalogMemberMixin(MappableMixin(Base))
  ) {
    // Create stable instances of DataSource and Entity instead
    // of generating a new one each time the traits change and mobx recomputes.
    // This vastly improves the performance.
    //
    // Note that these are private instances and must not be modified outside the Mixin
    private readonly _dataSource = new CustomDataSource("glTF Model");
    private readonly _modelEntity = new Entity({ name: "glTF Model Entity" });

    get hasGltfMixin() {
      return true;
    }

    protected disableZoomToOverride(traitValue: boolean) {
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
    private get cesiumHeightReference() {
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

    protected abstract get gltfModelUrl(): string | undefined;

    @computed
    private get modelGraphics() {
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

    protected shortReportOverride(traitValue: string | undefined) {
      if (this.terria.currentViewer.type === "Leaflet") {
        return i18next.t("models.commonModelErrors.3dTypeIn2dMode", this);
      }
      return traitValue;
    }

    @computed
    get modelEntity(): Entity {
      const entity = this._modelEntity;
      entity.position = new ConstantPositionProperty(this.cesiumPosition);
      entity.orientation = new ConstantProperty(this.cesiumRotation);
      entity.model = this.modelGraphics;
      return entity;
    }

    @computed
    get mapItems() {
      const modelEntity = this.modelEntity;
      const modelGraphics = this.modelGraphics;
      const dataSource = this._dataSource;
      if (modelGraphics === undefined) {
        return [];
      }

      dataSource.show = this.show;
      if (modelGraphics) modelGraphics.show = new ConstantProperty(this.show);
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
