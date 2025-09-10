import i18next from "i18next";
import { computed, makeObservable, override } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import HeadingPitchRoll from "terriajs-cesium/Source/Core/HeadingPitchRoll";
import Quaternion from "terriajs-cesium/Source/Core/Quaternion";
import Transforms from "terriajs-cesium/Source/Core/Transforms";
import ConstantPositionProperty from "terriajs-cesium/Source/DataSources/ConstantPositionProperty";
import ConstantProperty from "terriajs-cesium/Source/DataSources/ConstantProperty";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import ModelGraphics from "terriajs-cesium/Source/DataSources/ModelGraphics";
import Axis from "terriajs-cesium/Source/Scene/Axis";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
import AbstractConstructor from "../Core/AbstractConstructor";
import proxyCatalogItemUrl from "../Models/Catalog/proxyCatalogItemUrl";
import Model from "../Models/Definition/Model";
import GltfTraits from "../Traits/TraitsClasses/GltfTraits";
import CatalogMemberMixin from "./CatalogMemberMixin";
import MappableMixin from "./MappableMixin";
import ShadowMixin from "./ShadowMixin";
import Resource from "terriajs-cesium/Source/Core/Resource";
import { SelectableDimension } from "../Models/SelectableDimensions/SelectableDimensions";

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
    private readonly _dataSource = new CustomDataSource("glTF Model");
    private readonly _modelEntity = new Entity({ name: "glTF Model Entity" });

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
    private get cesiumHeightReference() {
      const heightReference: HeightReference =
        HeightReference[this.heightReference as keyof typeof HeightReference] ||
        HeightReference.NONE;
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

    protected abstract get gltfModelUrl(): string | Resource | undefined;

    @computed
    private get modelGraphics() {
      if (this.gltfModelUrl === undefined) {
        return undefined;
      }

      const url = this.gltfModelUrl;

      const options = {
        uri: new ConstantProperty(
          typeof url === "string" ? proxyCatalogItemUrl(this, url) : url
        ),
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

    @override
    get shortReport(): string | undefined {
      if (this.terria.currentViewer.type === "Leaflet") {
        return i18next.t("models.commonModelErrors.3dTypeIn2dMode", this);
      }
      return super.shortReport;
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

    @override
    get selectableDimensions(): SelectableDimension[] {
      return [...super.selectableDimensions, ...super.shadowDimensions];
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
