import { computed } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Matrix3 from "terriajs-cesium/Source/Core/Matrix3";
import Matrix4 from "terriajs-cesium/Source/Core/Matrix4";
import Quaternion from "terriajs-cesium/Source/Core/Quaternion";
import Transforms from "terriajs-cesium/Source/Core/Transforms";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import ModelGraphics from "terriajs-cesium/Source/DataSources/ModelGraphics";
import Axis from "terriajs-cesium/Source/Scene/Axis";
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
    name: "Version",
    description: "Version of glTF (either 1 or 2). The default is 2"
  })
  version?: number;
}

export default class GltfCatalogItem
  extends UrlMixin(CatalogMemberMixin(CreateModel(GltfCatalogItemTraits)))
  implements Mappable {
  static readonly type = "gltf";
  get type() {
    return GltfCatalogItem.type;
  }

  @computed
  get _cesiumUpAxis() {
    if (this.upAxis === undefined) {
      return Axis.Z;
    }
    return Axis.fromName(this.upAxis);
  }

  @computed
  get _cesiumForwardAxis() {
    if (this.forwardAxis === undefined) {
      return Axis.X;
    }
    return Axis.fromName(this.forwardAxis);
  }

  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }
  loadMapItems(): Promise<void> {
    return Promise.resolve();
  }

  @computed
  private get _model(): ModelGraphics | undefined {
    if (this.url === undefined) {
      return undefined;
    }
    const options = {
      uri: this.url,
      scale: 50
      // shadows: this._cesiumShadows
    };

    var model = new ModelGraphics(options);
    // (model as any)._catalogItem = this;

    // this._subscriptions.push(
    //   knockout.getObservable(this, "_cesiumShadows").subscribe(value => {
    //     this._model.shadows = this._cesiumShadows;
    //   })
    // );
    return model;
  }

  @computed
  get mapItems() {
    const model = this._model;
    if (model === undefined) {
      return [];
    }
    model.show = this.show;
    let position, orientation;

    if (this.origin !== undefined) {
      position = Cartesian3.fromDegrees(
        this.origin.longitude || 0.0,
        this.origin.latitude || 0.0,
        this.origin.height || 0.0
      );
      let computedModelMatrix = Matrix4.IDENTITY.clone();
      if (this._cesiumUpAxis === Axis.Y) {
        computedModelMatrix = Matrix4.multiplyTransformation(
          computedModelMatrix,
          Axis.Y_UP_TO_Z_UP,
          computedModelMatrix
        );
      } else if (this._cesiumUpAxis === Axis.X) {
        computedModelMatrix = Matrix4.multiplyTransformation(
          computedModelMatrix,
          Axis.X_UP_TO_Y_UP,
          computedModelMatrix
        );
      }
      if (this._cesiumForwardAxis === Axis.Z) {
        // glTF 2.0 has a Z-forward convention that must be adapted here to X-forward.
        Matrix4.multiplyTransformation(
          computedModelMatrix,
          Axis.Z_UP_TO_X_UP,
          computedModelMatrix
        );
      }
      // Cancel default Axis rotation on Cesium Model
      const unwantedRotationInverse = new Matrix4();
      Matrix4.multiplyTransformation(
        this.version === 1 ? Matrix4.IDENTITY : Axis.X_UP_TO_Z_UP,
        Axis.Z_UP_TO_Y_UP,
        unwantedRotationInverse
      );

      Matrix4.multiplyTransformation(
        computedModelMatrix,
        unwantedRotationInverse,
        computedModelMatrix
      );

      Matrix4.multiplyTransformation(
        Transforms.eastNorthUpToFixedFrame(position),
        computedModelMatrix,
        computedModelMatrix
      );

      const rotation = new Matrix3();
      Matrix4.getRotation(computedModelMatrix, rotation);
      orientation = Quaternion.fromRotationMatrix(rotation);
    }

    const dataSource = new CustomDataSource(this.name || "glTF model");
    dataSource.entities.add(
      new Entity({
        position,
        orientation: orientation as any,
        model
      })
    );

    // Also shadows
    return [dataSource];
  }
}
