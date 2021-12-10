import { computed } from "mobx";
import Matrix4 from "terriajs-cesium/Source/Core/Matrix4";
import ClippingPlane from "terriajs-cesium/Source/Scene/ClippingPlane";
import ClippingPlaneCollection from "terriajs-cesium/Source/Scene/ClippingPlaneCollection";
import { ClippingBoxTraits } from "../Traits/TraitsClasses/ClippingPlanesTraits";
import BoxDrawing from "./BoxDrawing";
import Model from "./Definition/Model";

export default class ClippingBox {
  private options: Model<ClippingBoxTraits>;

  constructor(
    readonly model: import("../ModelMixins/ClippingMixin").default.Instance
  ) {
    this.options = model.clippingBox;
  }

  @computed
  get clippingPlanes(): ClippingPlane[] {
    const clipDirection = this.options.clipDirection === "inside" ? -1 : 1;
    const clippingPlanes = this.boxDrawing.planes.map(
      plane => new ClippingPlane(plane.normal, clipDirection * plane.distance)
    );
    return clippingPlanes;
  }

  @computed
  get modelMatrix(): Matrix4 {
    return this.boxDrawing.localTransform;
  }

  @computed
  get boxDrawing() {
    const boxDrawing = new BoxDrawing(
      this.model.clippingPlanesOriginMatrix(),
      this.model.clippingBox
    );
    return boxDrawing;
  }

  @computed
  get clippingPlaneCollection() {
    const clipDirection = this.options.clipDirection;
    const clipModel = this.options.clipModel;
    const clippingPlaneCollection = new ClippingPlaneCollection({
      enabled: clipModel,
      // 1. When clipping outside the box, the clipping plane normals point
      // inwards and anything that falls outside *any* plane must be clipped
      // (hence unionClippingRegions=true)
      // 2. When clipping inside the box, the plane normals point outwards and
      // a region must be clipped only if it is outside *all* the planes (hence
      // unionClippingRegions=false).
      unionClippingRegions: clipDirection === "outside",
      planes: this.clippingPlanes
    });
    clippingPlaneCollection.modelMatrix = this.modelMatrix;
    return clippingPlaneCollection;
  }

  @computed
  get dataSource() {
    if (this.options.showEditorUi) {
      return this.boxDrawing.dataSource;
    }
  }
}

// import { computed, onBecomeObserved, onBecomeUnobserved } from "mobx";
// import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
// import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
// import Matrix4 from "terriajs-cesium/Source/Core/Matrix4";
// import Plane from "terriajs-cesium/Source/Core/Plane";
// import Quaternion from "terriajs-cesium/Source/Core/Quaternion";
// import TranslationRotationScale from "terriajs-cesium/Source/Core/TranslationRotationScale";
// import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
// import ClippingPlane from "terriajs-cesium/Source/Scene/ClippingPlane";
// import ClippingPlaneCollection from "terriajs-cesium/Source/Scene/ClippingPlaneCollection";
// import Scene from "terriajs-cesium/Source/Scene/Scene";
// import { ClippingBoxTraits } from "../Traits/TraitsClasses/ClippingPlanesTraits";
// import Model from "./Definition/Model";

// export default class ClippingBox {
//   constructor(
//     readonly scene: Scene,
//     readonly clippingPlaneOriginMatrix: Matrix4,
//     readonly options: Model<ClippingBoxTraits>
//   ) {
//     onBecomeObserved(this, "dataSource", () => this.startBoxInteraction());
//     onBecomeUnobserved(this, "dataSource", () => this.stopBoxInteraction());
//   }

//   startBoxInteraction() {
//     console.log("**start box interaction**");
//   }

//   stopBoxInteraction() {
//     console.log("**stop box interaction**");
//   }

//   @computed
//   get modelMatrix() {
//     const options = this.options;
//     const positionWC =
//       options.position.longitude !== undefined &&
//       options.position.latitude !== undefined &&
//       options.position.height !== undefined
//         ? Cartesian3.fromDegrees(
//             options.position.longitude,
//             options.position.latitude,
//             options.position.height
//           )
//         : this.getDefaultPosition();

//     const positionLC = Matrix4.multiplyByPoint(
//       Matrix4.inverseTransformation(
//         this.clippingPlaneOriginMatrix,
//         new Matrix4()
//       ),
//       positionWC,
//       new Cartesian3()
//     );

//     const dimensions =
//       options.dimensions.length !== undefined &&
//       options.dimensions.width !== undefined &&
//       options.dimensions.height !== undefined
//         ? new Cartesian3(
//             options.dimensions.length,
//             options.dimensions.width,
//             options.dimensions.height
//           )
//         : this.getDefaultDimensions();

//     const rotation = Quaternion.IDENTITY;
//     console.log(positionWC, positionLC, dimensions);
//     return Matrix4.fromTranslationRotationScale(
//       new TranslationRotationScale(positionLC, rotation, dimensions)
//     );
//   }

//   getDefaultPosition(): Cartesian3 {
//     const center = Matrix4.getTranslation(
//       this.clippingPlaneOriginMatrix,
//       new Cartesian3()
//     );
//     const carto = Cartographic.fromCartesian(center);
//     carto.height = 0;
//     return Cartographic.toCartesian(carto);
//   }

//   getDefaultDimensions(): Cartesian3 {
//     return new Cartesian3(100, 100, 100);
//   }

//   @computed
//   get planes(): Plane[] {
//     // We use the offset sign to control the direction of the clipping plane
//     // normals. A positive value will make all the normals point inwards and a
//     // negative value will make all the normals point outwards. Together with
//     // `unionClippingRegions` we can use this effect to control the clip direction
//     // to either clip inside or outside the box.
//     const offset = this.options.clipDirection === "inside" ? -0.5 : 0.5;
//     return [
//       new ClippingPlane(new Cartesian3(0, 0, 1), offset),
//       new ClippingPlane(new Cartesian3(0, 0, -1), offset),
//       new ClippingPlane(new Cartesian3(0, 1, 0), offset),
//       new ClippingPlane(new Cartesian3(0, -1, 0), offset),
//       new ClippingPlane(new Cartesian3(1, 0, 0), offset),
//       new ClippingPlane(new Cartesian3(-1, 0, 0), offset)
//     ];
//   }

//   @computed
//   get clippingPlaneCollection(): ClippingPlaneCollection {
//     return new ClippingPlaneCollection({
//       enabled: true,
//       // 1. When clipping outside the box, the clipping plane normals point
//       // inwards and anything that falls outside *any* plane must be clipped
//       // (hence unionClippingRegions=true)
//       // 2. When clipping inside the box, the plane normals point outwards and
//       // a region must be clipped only if it is outside *all* the planes (hence
//       // unionClippingRegions=false).
//       unionClippingRegions: this.options.clipDirection === "outside",
//       planes: this.planes,
//       modelMatrix: this.modelMatrix
//     });
//   }

//   @computed
//   get dataSource(): CustomDataSource | undefined {
//     const startBoxInteraction = () => this.startBoxInteraction();
//     const stopBoxInteraction = () => this.stopBoxInteraction();
//     const dataSource = new Proxy(new CustomDataSource(), {
//       set: function(target, prop, value) {
//         if (prop === "show") {
//           value ? startBoxInteraction() : stopBoxInteraction();
//         }
//         return Reflect.set(target, prop, value);
//       }
//     });

//     this.drawBoxSides(dataSource);
//     this.drawBoxCornerPoints(dataSource);
//     return dataSource;
//   }

//   drawBoxSides(dataSource: CustomDataSource) {
//     this.planes.forEach(plane => {});
//   }

//   drawBoxCornerPoints(dataSource: CustomDataSource) {
//     const cornerPoints = [
//       new Cartesian3(-0.5, -0.5, -0.5),
//       new Cartesian3(-0.5, 0.5, -0.5),
//       new Cartesian3(0.5, -0.5, -0.5),
//       new Cartesian3(0.5, 0.5, -0.5),
//       new Cartesian3(-0.5, -0.5, 0.5),
//       new Cartesian3(-0.5, 0.5, 0.5),
//       new Cartesian3(0.5, -0.5, 0.5),
//       new Cartesian3(0.5, 0.5, 0.5)
//     ];
//   }
// }

// // export default class ClippingBox {
// //   constructor(readonly options: ClippingBoxOptions) {
// //     this.modelMatrix = this.createModelMatrix(position, dimensions);
// //     this.clippingPlanes = this.createClippingPlanes(
// //       options.clipDirection ?? "outside"
// //     );
// //     this.clippingPlanesCollection = this.createClippingPlaneCollection(
// //       this.modelMatrix,
// //       this.clippingPlanes
// //     );
// //     this.dataSource = this.createDataSource(this.modelMatrix);
// //   }

// //   createModelMatrix() {}

// //   createClippingPlaneCollection(
// //     modelMatrix: Matrix4,
// //     planes: Plane[]
// //   ): ClippingPlaneCollection {
// //     const clippingPlaneCollection = new ClippingPlaneCollection({
// //       enabled: true,
// //       unionClippingRegions: true,
// //       planes,
// //       modelMatrix
// //     });
// //     return clippingPlaneCollection;
// //   }

// //   createClippingPlanes(clipDirection: ClipDirection): Plane[] {
// //     return clipDirection === "outside"
// //       ? [
// //           new ClippingPlane(new Cartesian3(0, 0, 1), 0.5),
// //           new ClippingPlane(new Cartesian3(0, 0, -1), 0.5),
// //           new ClippingPlane(new Cartesian3(0, 1, 0), 0.5),
// //           new ClippingPlane(new Cartesian3(0, -1, 0), 0.5),
// //           new ClippingPlane(new Cartesian3(1, 0, 0), 0.5),
// //           new ClippingPlane(new Cartesian3(-1, 0, 0), 0.5)
// //         ]
// //       : [
// //           new ClippingPlane(new Cartesian3(0, 0, 1), -0.5),
// //           new ClippingPlane(new Cartesian3(0, 0, -1), -0.5),
// //           new ClippingPlane(new Cartesian3(0, 1, 0), -0.5),
// //           new ClippingPlane(new Cartesian3(0, -1, 0), -0.5),
// //           new ClippingPlane(new Cartesian3(1, 0, 0), -0.5),
// //           new ClippingPlane(new Cartesian3(-1, 0, 0), -0.5)
// //         ];
// //   }

// //   createDataSource(modelMatrix: Matrix4): CustomDataSource {}
// // }
