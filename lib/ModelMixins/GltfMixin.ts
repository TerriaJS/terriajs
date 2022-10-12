import i18next from "i18next";
import { computed, trace } from "mobx";
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
import Constructor from "../Core/Constructor";
import Model from "../Models/Definition/Model";
import GltfTraits from "../Traits/TraitsClasses/GltfTraits";
import CatalogMemberMixin from "./CatalogMemberMixin";
import MappableMixin from "./MappableMixin";
import ShadowMixin from "./ShadowMixin";

// We want TS to look at the type declared in lib/ThirdParty/terriajs-cesium-extra/index.d.ts
// and import doesn't allows us to do that, so instead we use require + type casting to ensure
// we still maintain the type checking, without TS screaming with errors
const Axis: Axis = require("terriajs-cesium/Source/Scene/Axis").default;

type GltfModel = Model<GltfTraits>;

function GltfMixin<T extends Constructor<GltfModel>>(Base: T) {
  abstract class GltfMixin extends ShadowMixin(
    CatalogMemberMixin(MappableMixin(Base))
  ) {
    private readonly dataSource = new CustomDataSource("glTF Model");
    private readonly _gltfModelEntity = new Entity();

    get hasGltfMixin() {
      return true;
    }

    /**
     * Allow zooming to item on upload only if the item is geo-referenced
     */
    @computed
    get zoomToItemOnUpload() {
      return this.cesiumPosition !== undefined;
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
    private get cesiumPosition(): Cartesian3 | undefined {
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
      }
      return undefined;
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
        this.cesiumPosition ?? Cartesian3.ZERO,
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
        uri: new ConstantProperty(this.gltfModelUrl),
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
    get gltfModelEntity(): Entity {
      const entity = this._gltfModelEntity;
      entity.position = new ConstantPositionProperty(
        this.cesiumPosition ?? Cartesian3.ZERO
      );
      entity.orientation = new ConstantProperty(this.orientation);
      entity.model = this.model;
      return entity;
    }

    @computed
    get mapItems() {
      trace();
      if (this.model === undefined) {
        return [];
      }

      this.model.show = new ConstantProperty(this.show);
      const dataSource = this.dataSource;
      if (this.name) {
        this.dataSource.name = this.name;
      }
      // const dataSource: CustomDataSource = new CustomDataSource(
      //   this.name || "glTF model"
      // );
      const modelEntity = this.gltfModelEntity;
      // modelEntity.position = new ConstantPositionProperty(this.cesiumPosition);
      // modelEntity.orientation = new ConstantProperty(this.orientation);
      // modelEntity.model = this.model;

      // const modelEntity = new Entity({
      //   position: new ConstantPositionProperty(this.cesiumPosition),
      //   orientation: new ConstantProperty(this.orientation),
      //   model: this.model
      // });
      console.log("**createEntity**", this.name, modelEntity.id);
      if (!dataSource.entities.contains(modelEntity)) {
        dataSource.entities.add(modelEntity);
      }

      // const controls = new CustomDataSource();

      // controls.entities.add(
      //   new Entity({
      //     position: new CallbackProperty(
      //       () => modelEntity.position?.getValue(JulianDate.now()),
      //       false
      //     ),
      //     point: {
      //       color: Color.YELLOW,
      //       pixelSize: 20
      //     }
      //   })
      // );

      // controls.entities.add(
      //   new Entity({
      //     position: new CallbackProperty(
      //       () => window.boxPositionMin ?? Cartesian3.ZERO,
      //       false
      //     ),
      //     point: {
      //       color: Color.ORANGE,
      //       pixelSize: 10
      //     }
      //   })
      // );

      // controls.entities.add(
      //   new Entity({
      //     position: new CallbackProperty(
      //       () => window.boxPositionMax ?? Cartesian3.ZERO,
      //       false
      //     ),
      //     point: {
      //       color: Color.PINK,
      //       pixelSize: 10
      //     }
      //   })
      // );

      dataSource.show = this.show;
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
