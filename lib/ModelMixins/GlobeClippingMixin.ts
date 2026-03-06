import { action, autorun, makeObservable, override } from "mobx";
import AbstractConstructor from "../Core/AbstractConstructor";
import Model from "../Models/Definition/Model";
import SelectableDimensions, {
  SelectableDimensionCheckbox
} from "../Models/SelectableDimensions/SelectableDimensions";
import GlobeClippingTraits from "../Traits/TraitsClasses/GlobeClippingTraits";
import i18next from "i18next";
import filterOutUndefined from "../Core/filterOutUndefined";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import ClippingPlane from "terriajs-cesium/Source/Scene/ClippingPlane";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import ClippingPlaneCollection from "terriajs-cesium/Source/Scene/ClippingPlaneCollection";
import Transforms from "terriajs-cesium/Source/Core/Transforms";
import BoundingSphere from "terriajs-cesium/Source/Core/BoundingSphere";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import CesiumColor from "terriajs-cesium/Source/Core/Color";

type BaseType = Model<GlobeClippingTraits> & SelectableDimensions;

function GlobeClippingMixin<T extends AbstractConstructor<BaseType>>(Base: T) {
  abstract class GlobeClippingMixinBase extends Base {
    constructor(...args: any[]) {
      super(...args);
      makeObservable(this);

      autorun(() => {
        if (this.data) {
          this.autoComputeClippingPlanes(
            this.globeClippingEnabled ? this.data : undefined
          );
        }
      });
    }

    get hasGlobeClippingMixin() {
      return true;
    }

    @override
    get selectableDimensions() {
      const globeClippingCheckbox: SelectableDimensionCheckbox | undefined =
        this.globeClippingControlShowed
          ? {
              type: "checkbox",
              id: "globe-clipping-box",
              selectedId: this.globeClippingEnabled ? "true" : "false",
              options: [
                {
                  id: "true",
                  name: `${i18next.t("models.globeClipping.enableMessage")}`
                },
                {
                  id: "false",
                  name: i18next.t("models.globeClipping.enableMessage")
                }
              ],
              setDimensionValue: action((stratumId, value) => {
                this.setTrait(
                  stratumId,
                  "globeClippingEnabled",
                  value === "true"
                );
              })
            }
          : undefined;

      return filterOutUndefined([
        ...super.selectableDimensions,
        globeClippingCheckbox
      ]);
    }

    abstract get data(): DataSource | undefined;

    autoComputeClippingPlanes(dataSource: DataSource | undefined) {
      if (!this.terria.cesium) {
        return;
      }

      const globe = this.terria.cesium.scene.globe;

      if (dataSource === undefined) {
        globe.backFaceCulling = true;
        globe.showSkirts = true;
        if (globe.clippingPlanes) {
          globe.clippingPlanes.enabled = false;
        }
        return;
      }

      const points: Cartesian3[] = dataSource?.entities.values
        .map((elem) => {
          return elem.position?.getValue(JulianDate.now());
        })
        .filter((elem): elem is Cartesian3 => !!elem);
      const sphere = BoundingSphere.fromPoints(points);
      const position = sphere.center;
      const distance = sphere.radius;

      globe.clippingPlanes = new ClippingPlaneCollection({
        modelMatrix: Transforms.eastNorthUpToFixedFrame(position),
        planes: [
          new ClippingPlane(new Cartesian3(1.0, 0.0, 0.0), distance),
          new ClippingPlane(new Cartesian3(-1.0, 0.0, 0.0), distance),
          new ClippingPlane(new Cartesian3(0.0, 1.0, 0.0), distance),
          new ClippingPlane(new Cartesian3(0.0, -1.0, 0.0), distance)
        ],
        unionClippingRegions: true,
        edgeWidth: 1.0,
        edgeColor: CesiumColor.WHITE,
        enabled: true
      });
      globe.backFaceCulling = false;
      globe.showSkirts = false;
    }
  }

  return GlobeClippingMixinBase;
}

namespace GlobeClippingMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof GlobeClippingMixin>> {}

  export function isMixedInto(model: any): model is Instance {
    return model?.hasGlobeClippingMixin === true;
  }
}

export default GlobeClippingMixin;
