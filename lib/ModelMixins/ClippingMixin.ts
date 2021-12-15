import i18next from "i18next";
import { action, computed, toJS } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import clone from "terriajs-cesium/Source/Core/clone";
import Color from "terriajs-cesium/Source/Core/Color";
import Matrix4 from "terriajs-cesium/Source/Core/Matrix4";
import Transforms from "terriajs-cesium/Source/Core/Transforms";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import ClippingPlane from "terriajs-cesium/Source/Scene/ClippingPlane";
import ClippingPlaneCollection from "terriajs-cesium/Source/Scene/ClippingPlaneCollection";
import Constructor from "../Core/Constructor";
import filterOutUndefined from "../Core/filterOutUndefined";
import BoxDrawing from "../Models/BoxDrawing";
import CommonStrata from "../Models/Definition/CommonStrata";
import Model from "../Models/Definition/Model";
import updateModelFromJson from "../Models/Definition/updateModelFromJson";
import { SelectableDimension } from "../Models/SelectableDimensions";
import ClippingPlanesTraits from "../Traits/TraitsClasses/ClippingPlanesTraits";
import LatLonHeightTraits from "../Traits/TraitsClasses/LatLonHeightTraits";
import MappableTraits from "../Traits/TraitsClasses/MappableTraits";

type BaseType = Model<ClippingPlanesTraits & MappableTraits>;
type InstanceType = BaseType & {
  clippingPlanesOriginMatrix(): Matrix4;
  clippingPlaneCollection: ClippingPlaneCollection | undefined;
  clippingDimension: SelectableDimension | undefined;
  clippingMapItems: CustomDataSource[];
};

function ClippingMixin<T extends Constructor<BaseType>>(
  Base: T
): T & Constructor<InstanceType> {
  abstract class MixedClass extends Base implements InstanceType {
    private _clippingBoxDrawing?: BoxDrawing;
    abstract clippingPlanesOriginMatrix(): Matrix4;

    private clippingPlaneModelMatrix: Matrix4 = Matrix4.IDENTITY.clone();

    @computed
    get inverseClippingPlanesOriginMatrix(): Matrix4 {
      return Matrix4.inverse(this.clippingPlanesOriginMatrix(), new Matrix4());
    }

    @computed
    private get simpleClippingPlaneCollection() {
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
    get clippingBoxPlaneCollection() {
      if (!this.clippingBox.enableFeature) {
        return;
      }

      const clipDirection =
        this.clippingBox.clipDirection === "inside" ? -1 : 1;
      const planes = BoxDrawing.localSidePlanes.map(plane => {
        return new ClippingPlane(plane.normal, plane.distance * clipDirection);
      });
      const clippingPlaneCollection = new ClippingPlaneCollection({
        planes,
        unionClippingRegions: this.clippingBox.clipDirection === "outside",
        enabled: this.clippingBox.clipModel
      });
      clippingPlaneCollection.modelMatrix = this.clippingPlaneModelMatrix;
      return clippingPlaneCollection;
    }

    @computed
    get clippingPlaneCollection(): ClippingPlaneCollection | undefined {
      return (
        this.simpleClippingPlaneCollection ?? this.clippingBoxPlaneCollection
      );
    }

    @computed
    get clippingMapItems(): CustomDataSource[] {
      return filterOutUndefined([this.clippingBoxDrawing?.dataSource]);
    }

    @computed
    private get clippingBoxDrawing(): BoxDrawing | undefined {
      const options = this.clippingBox;
      const cesium = this.terria.cesium;
      if (
        !cesium ||
        !options.enableFeature ||
        !options.clipModel ||
        !options.showEditorUi
      ) {
        if (this._clippingBoxDrawing) {
          this._clippingBoxDrawing = undefined;
        }
        return;
      }

      const clippingPlanesOriginMatrix = this.clippingPlanesOriginMatrix();

      let position = LatLonHeightTraits.toCartesian(this.clippingBox.position);
      if (!position) {
        // Use clipping plane origin as position but height set to 0 so that the box is grounded.
        const cartographic = Cartographic.fromCartesian(
          Matrix4.getTranslation(clippingPlanesOriginMatrix, new Cartesian3())
        );
        cartographic.height = 0;
        position = Cartographic.toCartesian(
          cartographic,
          cesium.scene.globe.ellipsoid,
          new Cartesian3()
        );
      }

      const dimensions = new Cartesian3(
        this.clippingBox.dimensions.length ?? 100,
        this.clippingBox.dimensions.width ?? 100,
        this.clippingBox.dimensions.height ?? 100
      );

      const boxTransform = Matrix4.multiply(
        Transforms.eastNorthUpToFixedFrame(position),
        Matrix4.fromScale(dimensions, new Matrix4()),
        new Matrix4()
      );

      Matrix4.multiply(
        this.inverseClippingPlanesOriginMatrix,
        boxTransform,
        this.clippingPlaneModelMatrix
      );

      if (this._clippingBoxDrawing) {
        this._clippingBoxDrawing.setTransform(boxTransform);
      } else {
        this._clippingBoxDrawing = new BoxDrawing(
          cesium,
          boxTransform,
          action(({ modelMatrix, isFinished }) => {
            Matrix4.multiply(
              this.inverseClippingPlanesOriginMatrix,
              modelMatrix,
              this.clippingPlaneModelMatrix
            );
            if (isFinished) {
              LatLonHeightTraits.setFromCartesian(
                this.clippingBox.position,
                CommonStrata.user,
                Matrix4.getTranslation(modelMatrix, new Cartesian3())
              );
              const dimensions = Matrix4.getScale(
                modelMatrix,
                new Cartesian3()
              );
              updateModelFromJson(
                this.clippingBox.dimensions,
                CommonStrata.user,
                {
                  length: dimensions.x,
                  width: dimensions.y,
                  height: dimensions.z
                }
              );
            }
          })
        );
      }
      return this._clippingBoxDrawing;
    }

    @computed
    get clippingDimension(): SelectableDimension | undefined {
      if (!this.clippingBox.enableFeature) {
        return undefined;
      }

      return {
        type: "group",
        id: "clipping-box",
        name: i18next.t("models.clippingBox.groupName"),
        selectableDimensions: [
          {
            id: "clip-model",
            type: "checkbox",
            selectedId: this.clippingBox.clipModel ? "true" : "false",
            options: [
              {
                id: "true",
                name: i18next.t("models.clippingBox.clipModel")
              },
              {
                id: "false",
                name: i18next.t("models.clippingBox.clipModel")
              }
            ],
            setDimensionValue: (stratumId, value) => {
              this.clippingBox.setTrait(
                stratumId,
                "clipModel",
                value === "true"
              );
            }
          },
          {
            id: "show-clip-editor-ui",
            type: "checkbox",
            selectedId: this.clippingBox.showEditorUi ? "true" : "false",
            disable: this.clippingBox.clipModel === false,
            options: [
              {
                id: "true",
                name: i18next.t("models.clippingBox.showEditorUi")
              },
              {
                id: "false",
                name: i18next.t("models.clippingBox.showEditorUi")
              }
            ],
            setDimensionValue: (stratumId, value) => {
              this.clippingBox.setTrait(
                stratumId,
                "showEditorUi",
                value === "true"
              );
            }
          },
          {
            id: "clip-direction",
            name: i18next.t("models.clippingBox.clipDirection.name"),
            type: "select",
            selectedId: this.clippingBox.clipDirection,
            disable: this.clippingBox.clipModel === false,
            options: [
              {
                id: "inside",
                name: i18next.t(
                  "models.clippingBox.clipDirection.options.inside"
                )
              },
              {
                id: "outside",
                name: i18next.t(
                  "models.clippingBox.clipDirection.options.outside"
                )
              }
            ],
            setDimensionValue: (stratumId, value) => {
              this.clippingBox.setTrait(stratumId, "clipDirection", value);
            }
          }
        ]
      };
    }
  }

  return MixedClass as any;
}

export default ClippingMixin;
