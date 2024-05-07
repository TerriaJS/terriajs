import i18next from "i18next";
import {
  action,
  computed,
  makeObservable,
  observable,
  override,
  toJS,
  untracked
} from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import clone from "terriajs-cesium/Source/Core/clone";
import Color from "terriajs-cesium/Source/Core/Color";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import HeadingPitchRoll from "terriajs-cesium/Source/Core/HeadingPitchRoll";
import Matrix3 from "terriajs-cesium/Source/Core/Matrix3";
import Matrix4 from "terriajs-cesium/Source/Core/Matrix4";
import Transforms from "terriajs-cesium/Source/Core/Transforms";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import ClippingPlane from "terriajs-cesium/Source/Scene/ClippingPlane";
import ClippingPlaneCollection from "terriajs-cesium/Source/Scene/ClippingPlaneCollection";
import AbstractConstructor from "../Core/AbstractConstructor";
import filterOutUndefined from "../Core/filterOutUndefined";
import runLater from "../Core/runLater";
import BoxDrawing from "../Models/BoxDrawing";
import Cesium from "../Models/Cesium";
import CommonStrata from "../Models/Definition/CommonStrata";
import Model from "../Models/Definition/Model";
import updateModelFromJson from "../Models/Definition/updateModelFromJson";
import SelectableDimensions, {
  SelectableDimension,
  SelectableDimensionCheckboxGroup
} from "../Models/SelectableDimensions/SelectableDimensions";
import Icon from "../Styled/Icon";
import ClippingPlanesTraits from "../Traits/TraitsClasses/ClippingPlanesTraits";
import HeadingPitchRollTraits from "../Traits/TraitsClasses/HeadingPitchRollTraits";
import LatLonHeightTraits from "../Traits/TraitsClasses/LatLonHeightTraits";

type BaseType = Model<ClippingPlanesTraits> & SelectableDimensions;

function ClippingMixin<T extends AbstractConstructor<BaseType>>(Base: T) {
  abstract class ClippingMixinBase extends Base {
    private _clippingBoxDrawing?: BoxDrawing;

    /**
     * Indicates whether we are currently zooming to the clipping box
     */
    @observable
    _isZoomingToClippingBox: boolean = false;

    /**
     * A trigger for activating the clipping box repositioning UI for this item.
     */
    @observable
    repositionClippingBoxTrigger = false;

    abstract clippingPlanesOriginMatrix(): Matrix4;

    private clippingPlaneModelMatrix: Matrix4 = Matrix4.IDENTITY.clone();

    // Use a stable clippign plane collection. Replacing the collection on
    // change seems to crash Cesium, which could be related to:
    // https://github.com/CesiumGS/cesium/issues/6599
    private _clippingPlaneCollection = new ClippingPlaneCollection();

    constructor(...args: any[]) {
      super(...args);
      makeObservable(this);
    }

    get hasClippingMixin() {
      return true;
    }

    @computed
    get inverseClippingPlanesOriginMatrix(): Matrix4 {
      return Matrix4.inverse(this.clippingPlanesOriginMatrix(), new Matrix4());
    }

    private get simpleClippingPlaneCollection() {
      if (!this.clippingPlanes) {
        return;
      }

      if (this.clippingPlanes.planes.length === 0) {
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

      return updateClippingPlanesCollection(
        this._clippingPlaneCollection,
        options
      );
    }

    @computed
    get clippingBoxPlaneCollection() {
      if (!this.clippingBox.enableFeature) {
        return;
      }

      const clippingPlaneCollection = this._clippingPlaneCollection;
      if (!this.clippingBox.clipModel) {
        clippingPlaneCollection.enabled = false;
        return clippingPlaneCollection;
      }

      const clipDirection =
        this.clippingBox.clipDirection === "inside" ? -1 : 1;
      const planes = BoxDrawing.localSidePlanes.map((plane) => {
        return new ClippingPlane(plane.normal, plane.distance * clipDirection);
      });

      untracked(() => {
        Matrix4.multiply(
          this.inverseClippingPlanesOriginMatrix,
          this.clippingBoxTransform,
          this.clippingPlaneModelMatrix
        );
      });

      updateClippingPlanesCollection(clippingPlaneCollection, {
        modelMatrix: this.clippingPlaneModelMatrix,
        planes,
        unionClippingRegions: this.clippingBox.clipDirection === "outside",
        enabled: this.clippingBox.clipModel
      });

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
    private get clippingBoxDimensions(): Cartesian3 {
      const dimensions = new Cartesian3(
        this.clippingBox.dimensions.length ?? 100,
        this.clippingBox.dimensions.width ?? 100,
        this.clippingBox.dimensions.height ?? 100
      );
      return dimensions;
    }

    @computed
    private get clippingBoxHpr(): HeadingPitchRoll | undefined {
      const { heading, pitch, roll } = this.clippingBox.rotation;
      return heading !== undefined && pitch !== undefined && roll !== undefined
        ? HeadingPitchRoll.fromDegrees(heading, pitch, roll)
        : undefined;
    }

    @computed
    private get clippingBoxPosition(): Cartesian3 {
      const dimensions = this.clippingBoxDimensions;

      const clippingPlanesOriginMatrix = this.clippingPlanesOriginMatrix();
      let position = LatLonHeightTraits.toCartesian(this.clippingBox.position);
      if (!position) {
        // Use clipping plane origin as position but height set to 0 so that the box is grounded.
        const cartographic = Cartographic.fromCartesian(
          Matrix4.getTranslation(clippingPlanesOriginMatrix, new Cartesian3())
        );
        // If the translation is at the center of the ellipsoid then this cartographic could be undefined.
        // Although it is not reflected in the typescript type.
        if (cartographic) {
          cartographic.height = dimensions.z / 2;
          position = Ellipsoid.WGS84.cartographicToCartesian(
            cartographic,
            new Cartesian3()
          );
        }
      }

      // Nothing we can do - assign to zero
      position ??= Cartesian3.ZERO.clone();
      return position;
    }

    @computed
    private get clippingBoxTransform(): Matrix4 {
      const hpr = this.clippingBoxHpr;
      const position = this.clippingBoxPosition;
      const dimensions = this.clippingBoxDimensions;
      const boxTransform = Matrix4.multiply(
        hpr
          ? Matrix4.fromRotationTranslation(
              Matrix3.fromHeadingPitchRoll(hpr),
              position
            )
          : Transforms.eastNorthUpToFixedFrame(position),
        Matrix4.fromScale(dimensions, new Matrix4()),
        new Matrix4()
      );
      return boxTransform;
    }

    @computed
    get clippingBoxDrawing(): BoxDrawing | undefined {
      const options = this.clippingBox;
      const cesium = this.terria.cesium;
      if (
        !cesium ||
        !options.enableFeature ||
        !options.clipModel ||
        !options.showClippingBox
      ) {
        if (this._clippingBoxDrawing) {
          this._clippingBoxDrawing = undefined;
        }
        return;
      }

      const boxTransform = this.clippingBoxTransform;
      Matrix4.multiply(
        this.inverseClippingPlanesOriginMatrix,
        boxTransform,
        this.clippingPlaneModelMatrix
      );

      if (this._clippingBoxDrawing) {
        this._clippingBoxDrawing.setTransform(boxTransform);
        this._clippingBoxDrawing.keepBoxAboveGround =
          this.clippingBox.keepBoxAboveGround;
      } else {
        this._clippingBoxDrawing = BoxDrawing.fromTransform(
          cesium,
          boxTransform,
          {
            keepBoxAboveGround: this.clippingBox.keepBoxAboveGround,
            onChange: action(({ modelMatrix, isFinished }) => {
              Matrix4.multiply(
                this.inverseClippingPlanesOriginMatrix,
                modelMatrix,
                this.clippingPlaneModelMatrix
              );
              if (isFinished) {
                const position = Matrix4.getTranslation(
                  modelMatrix,
                  new Cartesian3()
                );
                LatLonHeightTraits.setFromCartesian(
                  this.clippingBox.position,
                  CommonStrata.user,
                  position
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
                ).logError("Failed to update clipping box dimensions");

                const rotationMatrix = Matrix3.getRotation(
                  Matrix4.getMatrix3(modelMatrix, new Matrix3()),
                  new Matrix3()
                );
                HeadingPitchRollTraits.setFromRotationMatrix(
                  this.clippingBox.rotation,
                  CommonStrata.user,
                  rotationMatrix
                );
              }
            })
          }
        );
      }
      return this._clippingBoxDrawing;
    }

    @computed
    private get isClippingBoxPlaced() {
      const { longitude, latitude, height } = this.clippingBox.position;
      return (
        longitude !== undefined &&
        latitude !== undefined &&
        height !== undefined
      );
    }

    @override
    get selectableDimensions(): SelectableDimension[] {
      if (!this.clippingBox.enableFeature) {
        return super.selectableDimensions;
      }

      const checkboxGroupInputs: SelectableDimensionCheckboxGroup["selectableDimensions"] =
        this.repositionClippingBoxTrigger
          ? [
              /* don't show options when repositioning clipping box */
            ]
          : [
              {
                // Checkbox to show/hide clipping box
                id: "show-clip-editor-ui",
                type: "checkbox",
                selectedId: this.clippingBox.showClippingBox ? "true" : "false",
                disable: this.clippingBox.clipModel === false,
                options: [
                  {
                    id: "true",
                    name: i18next.t("models.clippingBox.showClippingBox")
                  },
                  {
                    id: "false",
                    name: i18next.t("models.clippingBox.showClippingBox")
                  }
                ],
                setDimensionValue: (stratumId, value) => {
                  this.clippingBox.setTrait(
                    stratumId,
                    "showClippingBox",
                    value === "true"
                  );
                }
              },
              {
                // Checkbox to clamp/unclamp box to ground
                id: "clamp-box-to-ground",
                type: "checkbox",
                selectedId: this.clippingBox.keepBoxAboveGround
                  ? "true"
                  : "false",
                disable:
                  this.clippingBox.clipModel === false ||
                  this.clippingBox.showClippingBox === false,
                options: [
                  {
                    id: "true",
                    name: i18next.t("models.clippingBox.keepBoxAboveGround")
                  },
                  {
                    id: "false",
                    name: i18next.t("models.clippingBox.keepBoxAboveGround")
                  }
                ],
                setDimensionValue: (stratumId, value) => {
                  this.clippingBox.setTrait(
                    stratumId,
                    "keepBoxAboveGround",
                    value === "true"
                  );
                }
              },
              {
                // Dropdown to change the clipping direction
                id: "clip-direction",
                name: i18next.t("models.clippingBox.clipDirection.name"),
                type: "select",
                selectedId: this.clippingBox.clipDirection,
                disable:
                  this.clippingBox.clipModel === false ||
                  this.clippingBox.showClippingBox === false,
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
              },
              ...this.repositioningAndZoomingDimensions
            ];

      return [
        ...super.selectableDimensions,
        {
          // Checkbox group that also enables/disables the clipping behaviour altogether
          type: "checkbox-group",
          id: "clipping-box",
          selectedId: this.clippingBox.clipModel ? "true" : "false",
          options: [
            {
              id: "true",
              name: `${i18next.t("models.clippingBox.clipModel")}`
            },
            {
              id: "false",
              name: i18next.t("models.clippingBox.clipModel")
            }
          ],
          emptyText: "Click on map to position clipping box",
          setDimensionValue: action((stratumId, value) => {
            const clipModel = value === "true";
            this.clippingBox.setTrait(stratumId, "clipModel", clipModel);

            // Trigger clipping box repositioning UI if the feature is enabled
            // and a box position is not already set.
            const triggerClippingBoxRepositioning = !this.isClippingBoxPlaced;

            if (triggerClippingBoxRepositioning) {
              this.repositionClippingBoxTrigger = true;
            }
          }),
          selectableDimensions: checkboxGroupInputs
        }
      ];
    }

    /**
     * Returns controls for repositioning and zooming to clipping box. Note
     * that these are temporary features that are enabled through a feature
     * flag. It will get removed once we switch to a new design for a global
     * clipping box.
     */
    @computed
    private get repositioningAndZoomingDimensions(): SelectableDimensionCheckboxGroup["selectableDimensions"] {
      const repositioningAndZoomingInputs: SelectableDimensionCheckboxGroup["selectableDimensions"] =
        [
          {
            // Button to zoom to clipping box
            id: "zoom-to-clipping-box-button",
            type: "button",
            value: "Zoom to&nbsp;&nbsp;&nbsp;",
            icon: this._isZoomingToClippingBox ? "spinner" : Icon.GLYPHS.search,
            disable:
              this.clippingBox.clipModel === false ||
              this.clippingBoxDrawing === undefined,
            setDimensionValue: () => {
              if (!this._isZoomingToClippingBox) {
                this._zoomToClippingBox();
              }
            }
          },
          {
            id: "reposition-clipping-box",
            type: "button",
            value: "Reposition",
            icon: Icon.GLYPHS.geolocation,
            disable:
              this.clippingBox.clipModel === false ||
              this.clippingBoxDrawing === undefined,
            setDimensionValue: action(() => {
              // Disable repositioning tool if already active
              if (this.repositionClippingBoxTrigger) {
                this.repositionClippingBoxTrigger = false;
                return;
              }

              // Enable repositioning tool, but first disable it for other workbench items
              this.terria.workbench.items.forEach((it) => {
                if (ClippingMixin.isMixedInto(it)) {
                  it.repositionClippingBoxTrigger = false;
                }
              });
              this.repositionClippingBoxTrigger = true;
            })
          }
        ];
      return repositioningAndZoomingInputs;
    }

    /**
     * Initiates zooming to the clipping box if it is rendered on the map.
     * Times out in 3 seconds if zooming is not possible.
     *
     * Also sets the observable variable `_isZoomingToClippingBox` to indicate the
     * zooming status.
     */
    _zoomToClippingBox() {
      const dataSource = this.clippingBoxDrawing?.dataSource;
      const cesium = this.terria.cesium;
      if (!dataSource || !cesium) {
        return;
      }

      this._isZoomingToClippingBox = true;
      zoomToDataSourceWithTimeout(
        dataSource,
        3000, // timeout after 3 seconds if we cannot zoom for some reason
        cesium
      )
        .catch(() => {
          /* ignore errors */
        })
        .finally(
          action(() => {
            this._isZoomingToClippingBox = false;
          })
        );
    }
  }

  return ClippingMixinBase;
}

type ClippingPlaneCollectionOptions = NonNullable<
  ConstructorParameters<typeof ClippingPlaneCollection>[0]
>;

/**
 * Update a clipping plane collection instance with the given options
 */
function updateClippingPlanesCollection(
  clippingPlaneCollection: ClippingPlaneCollection,
  options: ClippingPlaneCollectionOptions
): ClippingPlaneCollection {
  const { planes, ...otherOptions } = options;
  Object.assign(clippingPlaneCollection, otherOptions);
  if (planes) {
    clippingPlaneCollection.removeAll();
    planes.forEach((plane) => clippingPlaneCollection.add(plane));
  }
  return clippingPlaneCollection;
}

/**
 * Zooms to the given dataSource and returns a promise that fullfills when the
 * zoom action is complete. If the dataSource has not been rendered on the map,
 * we wait for `timeoutMilliseconds` before rejecting the promise.
 */
function zoomToDataSourceWithTimeout(
  dataSource: DataSource,
  timeoutMilliseconds: number,
  cesium: Cesium
): Promise<void> {
  // DataSources rendered on the map
  const renderedDataSources = cesium.dataSources;
  if (renderedDataSources.contains(dataSource)) {
    return cesium.doZoomTo(dataSource);
  } else {
    // Create a promise that waits for the dataSource to be added to map or
    // timeout to complete whichever happens first
    return new Promise<void>((resolve, reject) => {
      const removeListener =
        renderedDataSources.dataSourceAdded.addEventListener((_, added) => {
          if (added === dataSource) {
            removeListener();
            resolve(cesium.doZoomTo(dataSource));
          }
        });
      runLater(removeListener, timeoutMilliseconds).then(reject);
    });
  }
}

namespace ClippingMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof ClippingMixin>> {}

  export function isMixedInto(model: any): model is Instance {
    return model?.hasClippingMixin === true;
  }
}

export default ClippingMixin;
