import { computed } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Matrix4 from "terriajs-cesium/Source/Core/Matrix4";
import Plane from "terriajs-cesium/Source/Core/Plane";
import Quaternion from "terriajs-cesium/Source/Core/Quaternion";
import TranslationRotationScale from "terriajs-cesium/Source/Core/TranslationRotationScale";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import ClippingPlane from "terriajs-cesium/Source/Scene/ClippingPlane";
import ClippingPlaneCollection from "terriajs-cesium/Source/Scene/ClippingPlaneCollection";
import Scene from "terriajs-cesium/Source/Scene/Scene";
import { ClippingBoxTraits } from "../Traits/TraitsClasses/ClippingPlanesTraits";
import Model from "./Definition/Model";

export default class ClippingBox {
  constructor(
    readonly scene: Scene,
    readonly clippingPlaneOriginMatrix: Matrix4,
    readonly options: Model<ClippingBoxTraits>
  ) {}

  @computed
  get modelMatrix() {
    const options = this.options;
    const positionWC =
      options.position.longitude !== undefined &&
      options.position.latitude !== undefined &&
      options.position.height !== undefined
        ? Cartesian3.fromDegrees(
            options.position.longitude,
            options.position.latitude,
            options.position.height
          )
        : this.getDefaultPosition();

    const positionLC = Matrix4.multiplyByPoint(
      Matrix4.inverseTransformation(
        this.clippingPlaneOriginMatrix,
        new Matrix4()
      ),
      positionWC,
      new Cartesian3()
    );

    const dimensions =
      options.dimensions.length !== undefined &&
      options.dimensions.width !== undefined &&
      options.dimensions.height !== undefined
        ? new Cartesian3(
            options.dimensions.length,
            options.dimensions.width,
            options.dimensions.height
          )
        : this.getDefaultDimensions();

    const rotation = Quaternion.IDENTITY;
    console.log(positionWC, positionLC, dimensions);
    return Matrix4.fromTranslationRotationScale(
      new TranslationRotationScale(positionLC, rotation, dimensions)
    );
  }

  getDefaultPosition(): Cartesian3 {
    return Matrix4.getTranslation(
      this.clippingPlaneOriginMatrix,
      new Cartesian3()
    );
  }

  getDefaultDimensions(): Cartesian3 {
    return new Cartesian3(100, 100, 100);
  }

  @computed
  get planes(): Plane[] {
    const clipDirection = this.options.clipDirection ?? "outside";
    return clipDirection === "outside"
      ? [
          new ClippingPlane(new Cartesian3(0, 0, 1), 0.5),
          new ClippingPlane(new Cartesian3(0, 0, -1), 0.5),
          new ClippingPlane(new Cartesian3(0, 1, 0), 0.5),
          new ClippingPlane(new Cartesian3(0, -1, 0), 0.5),
          new ClippingPlane(new Cartesian3(1, 0, 0), 0.5),
          new ClippingPlane(new Cartesian3(-1, 0, 0), 0.5)
        ]
      : [
          new ClippingPlane(new Cartesian3(0, 0, 1), -0.5),
          new ClippingPlane(new Cartesian3(0, 0, -1), -0.5),
          new ClippingPlane(new Cartesian3(0, 1, 0), -0.5),
          new ClippingPlane(new Cartesian3(0, -1, 0), -0.5),
          new ClippingPlane(new Cartesian3(1, 0, 0), -0.5),
          new ClippingPlane(new Cartesian3(-1, 0, 0), -0.5)
        ];
  }

  @computed
  get clippingPlaneCollection() {
    if (!this.options.enabled) {
      return;
    }

    return new ClippingPlaneCollection({
      enabled: true,
      unionClippingRegions: true,
      planes: this.planes,
      modelMatrix: this.modelMatrix
    });
  }

  @computed
  get dataSource(): CustomDataSource | undefined {
    const dataSource = new CustomDataSource();
    return dataSource;
  }
}

// export default class ClippingBox {
//   constructor(readonly options: ClippingBoxOptions) {
//     this.modelMatrix = this.createModelMatrix(position, dimensions);
//     this.clippingPlanes = this.createClippingPlanes(
//       options.clipDirection ?? "outside"
//     );
//     this.clippingPlanesCollection = this.createClippingPlaneCollection(
//       this.modelMatrix,
//       this.clippingPlanes
//     );
//     this.dataSource = this.createDataSource(this.modelMatrix);
//   }

//   createModelMatrix() {}

//   createClippingPlaneCollection(
//     modelMatrix: Matrix4,
//     planes: Plane[]
//   ): ClippingPlaneCollection {
//     const clippingPlaneCollection = new ClippingPlaneCollection({
//       enabled: true,
//       unionClippingRegions: true,
//       planes,
//       modelMatrix
//     });
//     return clippingPlaneCollection;
//   }

//   createClippingPlanes(clipDirection: ClipDirection): Plane[] {
//     return clipDirection === "outside"
//       ? [
//           new ClippingPlane(new Cartesian3(0, 0, 1), 0.5),
//           new ClippingPlane(new Cartesian3(0, 0, -1), 0.5),
//           new ClippingPlane(new Cartesian3(0, 1, 0), 0.5),
//           new ClippingPlane(new Cartesian3(0, -1, 0), 0.5),
//           new ClippingPlane(new Cartesian3(1, 0, 0), 0.5),
//           new ClippingPlane(new Cartesian3(-1, 0, 0), 0.5)
//         ]
//       : [
//           new ClippingPlane(new Cartesian3(0, 0, 1), -0.5),
//           new ClippingPlane(new Cartesian3(0, 0, -1), -0.5),
//           new ClippingPlane(new Cartesian3(0, 1, 0), -0.5),
//           new ClippingPlane(new Cartesian3(0, -1, 0), -0.5),
//           new ClippingPlane(new Cartesian3(1, 0, 0), -0.5),
//           new ClippingPlane(new Cartesian3(-1, 0, 0), -0.5)
//         ];
//   }

//   createDataSource(modelMatrix: Matrix4): CustomDataSource {}
// }
