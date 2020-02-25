import Constructor from "../Core/Constructor";
import Model from "../Models/Model";
import TimeFilterTraits from "../Traits/TimeFilterTraits";
import DiscretelyTimeVaryingTraits from "../Traits/DiscretelyTimeVaryingTraits";
import PickedFeatures from "../Map/PickedFeatures";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import createStratumInstance from "../Models/createStratumInstance";
import DiscreteTimeTraits from "../Traits/DiscreteTimeTraits";
import sortedIndexOf from "lodash/sortedIndexOf";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import filterOutUndefined from "../Core/filterOutUndefined";
import CommonStrata from "../Models/CommonStrata";
import { computed, action, observable } from "mobx";
import TimeVarying from "./TimeVarying";

type MixinModel = Model<TimeFilterTraits & DiscretelyTimeVaryingTraits> &
  TimeVarying;

/**
 * A Mixin for filtering discrete times at picked position by any property of the picked feature.
 */
function TimeFilterMixin<T extends Constructor<MixinModel>>(Base: T) {
  abstract class TimeFilterMixin extends Base {
    @observable intervalFilterFeature?: Entity;

    get hasTimeFilterMixin() {
      return true;
    }

    @computed
    get canFilterTimeByFeature(): boolean {
      return this.timeFilterProperty !== undefined;
    }

    @computed
    get filteredDiscreteTimes(): ReadonlyArray<DiscreteTimeTraits> | undefined {
      if (
        this.intervalFilterFeature === undefined ||
        this.intervalFilterFeature.properties === undefined ||
        this.timeFilterProperty === undefined
      ) {
        return;
      }
      const featureTimesProperty = this.intervalFilterFeature.properties[
        this.timeFilterProperty
      ];
      if (featureTimesProperty === undefined) return;
      const featureTimes: any = featureTimesProperty.getValue(this.currentTime);
      if (!Array.isArray(featureTimes)) return;
      const sortedDiscreteTimes = this.discreteTimes.map(dt => dt.time).sort();
      return filterOutUndefined(
        featureTimes.map(time => {
          if (sortedIndexOf(sortedDiscreteTimes, time) >= 0)
            return createStratumInstance(DiscreteTimeTraits, { time });
          else return undefined;
        })
      );
    }

    @action
    filterIntervalsByFeature(feature: Entity, pickedFeatures: PickedFeatures) {
      this.intervalFilterFeature = feature;
      if (!this.currentTimeAsJulianDate) return;
      const position = feature.position.getValue(this.currentTimeAsJulianDate);
      const cartographic = Ellipsoid.WGS84.cartesianToCartographic(position);
      this.setTrait(CommonStrata.user, "timeFilterPosition", {
        longitude: CesiumMath.toDegrees(cartographic.longitude),
        latitude: CesiumMath.toDegrees(cartographic.latitude),
        height: cartographic.height
      });
    }
  }

  return TimeFilterMixin;
}

namespace TimeFilterMixin {
  export interface TimeFilterMixin
    extends InstanceType<ReturnType<typeof TimeFilterMixin>> {}

  export function isMixedInto(model: any): model is TimeFilterMixin {
    return model && model.hasTimeFilterMixin;
  }
}

export default TimeFilterMixin;
