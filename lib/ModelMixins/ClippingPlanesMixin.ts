import { clone } from "lodash-es";
import { computed } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Color from "terriajs-cesium/Source/Core/Color";
import Matrix4 from "terriajs-cesium/Source/Core/Matrix4";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import ClippingPlane from "terriajs-cesium/Source/Scene/ClippingPlane";
import ClippingPlaneCollection from "terriajs-cesium/Source/Scene/ClippingPlaneCollection";
import Constructor from "../Core/Constructor";
import ClippingBox from "../Models/ClippingBox";
import Model from "../Models/Definition/Model";
import ClippingPlanesTraits from "../Traits/TraitsClasses/ClippingPlanesTraits";

type BaseType = Model<ClippingPlanesTraits>;

function ClippingMixin<T extends Constructor<BaseType>>(Base: T) {
  abstract class MixedClass extends Base {
    abstract clippingPlanesOriginMatrix: Matrix4 | undefined;

    private simpleClippingPlaneCollection() {
      if (!this.clippingPlanes) {
        return;
      }

      if (this.clippingPlanes.planes.length == 0) {
        return;
      }

      const {
        planes,
        enabled = true,
        unionClippingRegions = false,
        edgeColor,
        edgeWidth,
        modelMatrix
      } = this.clippingPlanes;

      const planesMapped = planes.map((plane: any) => {
        return new ClippingPlane(
          Cartesian3.fromArray(plane.normal || []),
          plane.distance
        );
      });

      let options = {
        planes: planesMapped,
        enabled,
        unionClippingRegions
      };

      if (edgeColor && edgeColor.length > 0) {
        options = Object.assign(options, {
          edgeColor: Color.fromCssColorString(edgeColor) || Color.WHITE
        });
      }

      if (edgeWidth && edgeWidth > 0) {
        options = Object.assign(options, { edgeWidth: edgeWidth });
      }

      if (modelMatrix && modelMatrix.length > 0) {
        const array = clone(toJS(modelMatrix));
        options = Object.assign(options, {
          modelMatrix: Matrix4.fromArray(array) || Matrix4.IDENTITY
        });
      }
      return new ClippingPlaneCollection(options);
    }

    @computed
    private get clippingBoxModel() {
      const scene = this.terria.cesium?.scene;
      const clippingPlanesOriginMatrix = this.clippingPlanesOriginMatrix;
      if (!scene || !this.clippingBox.enabled || !clippingPlanesOriginMatrix) {
        return;
      }

      return new ClippingBox(
        scene,
        clippingPlanesOriginMatrix,
        this.clippingBox
      );
    }

    @computed
    get clippingPlaneCollection() {
      if (this.clippingBox.enabled && this.clippingBoxModel) {
        return this.clippingBoxModel.clippingPlaneCollection;
      } else {
        return this.simpleClippingPlaneCollection;
      }
    }

    @computed
    get clippingGraphics(): CustomDataSource | undefined {
      if (this.clippingBox.enabled && this.clippingBoxModel) {
        return this.clippingBoxModel.dataSource;
      }
    }

    @computed
    get clippingDimension(): SelectableDimensionGroup {}
  }

  return MixedClass;
}

export default ClippingMixin;

function toJS(modelMatrix: readonly number[]): any {
  throw new Error("Function not implemented.");
}
