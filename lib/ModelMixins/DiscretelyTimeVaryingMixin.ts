import { action, computed } from "mobx";
import binarySearch from "terriajs-cesium/Source/Core/binarySearch";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import Constructor from "../Core/Constructor";
import filterOutUndefined from "../Core/filterOutUndefined";
import TerriaError from "../Core/TerriaError";
import Model from "../Models/Model";
import DiscretelyTimeVaryingTraits from "../Traits/DiscretelyTimeVaryingTraits";
import TimeVarying from "./TimeVarying";

type DiscretelyTimeVarying = Model<DiscretelyTimeVaryingTraits>;

export default function DiscretelyTimeVaryingMixin<
  T extends Constructor<DiscretelyTimeVarying>
>(Base: T) {
  abstract class DiscretelyTimeVaryingMixin extends Base
    implements TimeVarying {
    @computed
    get currentTime() {
      const time = super.currentTime;
      if (time === undefined) {
        if (this.initialTimeSource === "now") {
          return JulianDate.toIso8601(JulianDate.now());
        } else if (this.initialTimeSource === "start") {
          return this.startTime;
        } else if (this.initialTimeSource === "stop") {
          return this.stopTime;
        } else {
          throw new TerriaError({
            sender: this,
            title: "Invalid initialTime value",
            message:
              "The `initialTime` property has an invalid value: `" +
              this.initialTimeSource +
              "`."
          });
        }
      }
      return time;
    }

    @computed({ equals: JulianDate.equals })
    get currentTimeAsJulianDate() {
      return toJulianDate(this.currentTime);
    }

    @computed({ equals: JulianDate.equals })
    get startTimeAsJulianDate() {
      return toJulianDate(this.startTime);
    }

    @computed({ equals: JulianDate.equals })
    get stopTimeAsJulianDate() {
      return toJulianDate(this.stopTime);
    }

    @computed
    get discreteTimesAsSortedJulianDates() {
      const discreteTimes = this.discreteTimes;
      if (discreteTimes === undefined) {
        return undefined;
      }

      const asJulian = filterOutUndefined(
        discreteTimes.map(dt => {
          if (dt.time === undefined) {
            return undefined;
          }
          return {
            time: JulianDate.fromIso8601(dt.time),
            tag: dt.tag !== undefined ? dt.tag : dt.time
          };
        })
      );

      asJulian.sort((a, b) => JulianDate.compare(a.time, b.time));

      return asJulian;
    }

    @computed
    get currentDiscreteTimeIndex(): number | undefined {
      const currentTime = this.currentTimeAsJulianDate;
      if (currentTime === undefined) {
        return undefined;
      }

      const discreteTimes = this.discreteTimesAsSortedJulianDates;
      if (discreteTimes === undefined || discreteTimes.length === 0) {
        return undefined;
      }

      const exactIndex = binarySearch(
        discreteTimes,
        currentTime,
        (candidate, currentTime) =>
          JulianDate.compare(candidate.time, currentTime)
      );
      if (exactIndex >= 0) {
        return exactIndex;
      }

      const nextIndex = ~exactIndex;
      if (nextIndex === 0 || this.fromContinuous === "next") {
        // Before the first, or we want the next time no matter which is closest
        return nextIndex;
      } else if (
        nextIndex === discreteTimes.length ||
        this.fromContinuous === "previous"
      ) {
        // After the last, or we want the previous time no matter which is closest
        return nextIndex - 1;
      } else {
        const previousTime = discreteTimes[nextIndex - 1].time;
        const nextTime = discreteTimes[nextIndex].time;

        const timeFromPrevious = JulianDate.secondsDifference(
          currentTime,
          previousTime
        );
        const timeToNext = JulianDate.secondsDifference(nextTime, currentTime);
        if (timeToNext > timeFromPrevious) {
          return nextIndex - 1;
        } else {
          return nextIndex;
        }
      }
    }

    @computed
    get nextDiscreteTimeIndex(): number | undefined {
      const index = this.currentDiscreteTimeIndex;
      if (
        index === undefined ||
        index === this.discreteTimesAsSortedJulianDates!.length - 1
      ) {
        return undefined;
      }
      return index + 1;
    }

    @computed
    get previousDiscreteTimeIndex(): number | undefined {
      const index = this.currentDiscreteTimeIndex;
      if (index === undefined || index === 0) {
        return undefined;
      }
      return index - 1;
    }

    @computed({ equals: JulianDate.equals })
    get currentDiscreteJulianDate() {
      const index = this.currentDiscreteTimeIndex;
      return index === undefined
        ? undefined
        : this.discreteTimesAsSortedJulianDates![index].time;
    }

    @computed
    get currentDiscreteTimeTag() {
      const index = this.currentDiscreteTimeIndex;
      return index === undefined
        ? undefined
        : this.discreteTimesAsSortedJulianDates![index].tag;
    }

    @computed
    get previousDiscreteTimeTag() {
      const index = this.previousDiscreteTimeIndex;
      return index === undefined
        ? undefined
        : this.discreteTimesAsSortedJulianDates![index].tag;
    }

    @computed
    get nextDiscreteTimeTag() {
      const index = this.nextDiscreteTimeIndex;
      return index === undefined
        ? undefined
        : this.discreteTimesAsSortedJulianDates![index].tag;
    }

    @computed
    get isPreviousDiscreteTimeAvailable(): boolean {
      return this.previousDiscreteTimeIndex !== undefined;
    }

    @computed
    get isNextDiscreteTimeAvailable(): boolean {
      return this.nextDiscreteTimeIndex !== undefined;
    }

    @computed
    get startTime() {
      const time = super.startTime;
      if (
        time === undefined &&
        this.discreteTimesAsSortedJulianDates &&
        this.discreteTimesAsSortedJulianDates.length > 0
      ) {
        return JulianDate.toIso8601(
          this.discreteTimesAsSortedJulianDates[0].time
        );
      }
      return time;
    }

    @computed
    get stopTime() {
      const time = super.stopTime;
      if (
        time === undefined &&
        this.discreteTimesAsSortedJulianDates &&
        this.discreteTimesAsSortedJulianDates.length > 0
      ) {
        return JulianDate.toIso8601(
          this.discreteTimesAsSortedJulianDates[
            this.discreteTimesAsSortedJulianDates.length - 1
          ].time
        );
      }
      return time;
    }

    @action
    moveToPreviousDiscreteTime(stratumId: string) {
      const index = this.previousDiscreteTimeIndex;
      if (index === undefined) {
        return;
      }
      this.setTrait(
        stratumId,
        "currentTime",
        JulianDate.toIso8601(this.discreteTimesAsSortedJulianDates![index].time)
      );
    }

    @action
    moveToNextDiscreteTime(stratumId: string) {
      const index = this.nextDiscreteTimeIndex;
      if (index === undefined) {
        return;
      }
      this.setTrait(
        stratumId,
        "currentTime",
        JulianDate.toIso8601(this.discreteTimesAsSortedJulianDates![index].time)
      );
    }
  }

  return DiscretelyTimeVaryingMixin;
}

function toJulianDate(time: string | undefined): JulianDate | undefined {
  if (time === undefined) {
    return undefined;
  }
  return JulianDate.fromIso8601(time);
}
