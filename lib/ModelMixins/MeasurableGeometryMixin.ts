import { computed, action } from "mobx";
import AbstractConstructor from "../Core/AbstractConstructor";
import Model from "../Models/Definition/Model";
import StratumOrder from "../Models/Definition/StratumOrder";
import MappableTraits from "../Traits/TraitsClasses/MappableTraits";
import sampleTerrainMostDetailed from "terriajs-cesium/Source/Core/sampleTerrainMostDetailed";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import TerrainProvider from "terriajs-cesium/Source/Core/TerrainProvider";
import MeasurableGeometryManager, {
  MeasurableGeometry
} from "../ViewModels/MeasurableGeometry/MeasurableGeometryManager";
import { JsonObject } from "../Core/Json";

type MixinModel = Model<MappableTraits>;

function MeasurableGeometryMixin<T extends AbstractConstructor<MixinModel>>(
  Base: T
) {
  abstract class MeasurableGeometryMixin extends Base {
    @computed
    get hasMeasurableMixin() {
      return true;
    }

    abstract get canUseAsPath(): boolean;

    abstract computePath(): void;

    @action
    update(
      stopPoints: Cartographic[],
      pathNotes?: any,
      indexPath?: number,
      closeLoop?: boolean,
      isCircle?: boolean,
      circleRadius?: number,
      circleCenter?: Cartographic,
      geomProperties?: Partial<MeasurableGeometry> | JsonObject
    ) {
      if (indexPath && !this.terria.measurableGeometryManager[indexPath]) {
        this.terria.measurableGeometryManager.push(
          Object.freeze(new MeasurableGeometryManager(this.terria))
        );
      }
      this.terria.measurableGeometryManager[
        this.terria.measurableGeometryIndex
      ].sampleFromCartographics(
        stopPoints,
        closeLoop ?? false,
        false,
        [],
        pathNotes,
        true,
        indexPath,
        isCircle,
        circleRadius,
        circleCenter,
        geomProperties
      );
    }

    asPath(
      positions: Cartographic[],
      pathNotes?: any,
      indexPath?: number,
      closeLoop?: boolean,
      isCircle?: boolean,
      circleRadius?: number,
      circleCenter?: Cartographic,
      geomProperties?: Partial<MeasurableGeometry> | JsonObject
    ) {
      if (!this?.terria) {
        return;
      }

      const terrainProvider: TerrainProvider | undefined =
        this.terria?.cesium?.scene?.terrainProvider;
      const canSampleMostDetailed =
        !!terrainProvider && !!(terrainProvider as any).availability;

      let prom = Promise.resolve(positions);

      if (
        canSampleMostDetailed &&
        positions.every((element) => element.height < 1)
      ) {
        prom = prom.then((pos) =>
          sampleTerrainMostDetailed(terrainProvider, pos).catch(() => pos)
        );
      }

      prom.then((newPositions: Cartographic[]) => {
        this.update(
          newPositions,
          pathNotes,
          indexPath,
          closeLoop,
          isCircle,
          circleRadius,
          circleCenter,
          geomProperties
        );
      });
    }
  }

  return MeasurableGeometryMixin;
}

namespace MeasurableGeometryMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof MeasurableGeometryMixin>> {}

  export function isMixedInto(model: any): model is Instance {
    return model?.hasMeasurableMixin;
  }

  export const stratumName = "measureableStratum";
  StratumOrder.addLoadStratum(stratumName);
}

export default MeasurableGeometryMixin;
