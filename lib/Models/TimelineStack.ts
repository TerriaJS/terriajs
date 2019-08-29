import { action, computed, observable, IReactionDisposer, autorun } from "mobx";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import TimeVarying from "../ModelMixins/TimeVarying";
import CommonStrata from "./CommonStrata";
import filterOutUndefined from "../Core/filterOutUndefined";

/**
 * Manages a stack of all the time-varying datasets currently attached to the timeline. Provides
 * access to the current top dataset so that it can be displayed to the user.
 *
 * @constructor
 */
export default class TimelineStack {
  /**
   * The stratum of each layer in the stack in which to store the current time as the clock ticks.
   */
  tickStratumId: string = CommonStrata.user;

  @observable
  items: TimeVarying[] = [];

  private _disposeClockAutorun: IReactionDisposer;
  private _disposeTickSubscription: Cesium.Event.RemoveCallback;

  constructor(readonly clock: Cesium.Clock) {
    // Keep the Cesium clock in sync with the top layer's clock.
    this._disposeClockAutorun = autorun(() => {
      const topLayer = this.top;
      if (!topLayer || !topLayer.currentTimeAsJulianDate) {
        this.clock.shouldAnimate = false;
        return;
      }

      this.clock.currentTime = JulianDate.clone(
        topLayer.currentTimeAsJulianDate,
        this.clock.currentTime
      );
      this.clock.startTime = offsetIfUndefined(
        -43200.0,
        topLayer.currentTimeAsJulianDate,
        topLayer.startTimeAsJulianDate,
        this.clock.startTime
      );
      this.clock.stopTime = offsetIfUndefined(
        43200.0,
        topLayer.currentTimeAsJulianDate,
        topLayer.stopTimeAsJulianDate,
        this.clock.stopTime
      );
      if (topLayer.multiplier !== undefined) {
        this.clock.multiplier = topLayer.multiplier;
      } else {
        this.clock.multiplier = 60.0;
      }
      this.clock.shouldAnimate = !topLayer.isPaused;
    });

    this._disposeTickSubscription = this.clock.onTick.addEventListener(() => {
      this.syncToClock(this.tickStratumId);
    });
  }

  destroy() {
    if (this._disposeClockAutorun) {
      this._disposeClockAutorun();
    }
    if (this._disposeTickSubscription) {
      this._disposeTickSubscription();
    }
  }

  /**
   * The topmost time-series layer, or undefined if there is no such layer in the stack.
   */
  @computed
  get top(): TimeVarying | undefined {
    if (this.items.length === 0) {
      return undefined;
    }
    return this.items[this.items.length - 1];
  }

  @computed
  get itemIds(): readonly string[] {
    return filterOutUndefined(this.items.map(item => item.uniqueId));
  }

  /**
   * Determines if the stack contains a given item.
   * @param item The item to check.
   * @returns True if the stack contains the item; otherwise, false.
   */
  contains(item: TimeVarying): boolean {
    return this.items.indexOf(item) >= 0;
  }

  /**
   * Adds the supplied {@link TimeVarying} to the top of the stack. If the item is already in the stack, it will be moved
   * rather than added twice.
   *
   * @param item
   */
  @action
  addToTop(item: TimeVarying) {
    var currentIndex = this.items.indexOf(item);
    this.items.push(item);
    if (currentIndex > -1) {
      this.items.splice(currentIndex, 1);
    }
  }

  /**
   * Removes a layer from the stack, no matter what its location. If the layer is currently at the top, the value of
   * {@link TimelineStack#topLayer} will change.
   *
   * @param item;
   */
  @action
  remove(item: TimeVarying) {
    var index = this.items.indexOf(item);
    this.items.splice(index, 1);
  }

  /**
   * Promotes the supplied {@link CatalogItem} to the top of the stack if it is already in the stack. If the item is not
   * already in the stack it won't be added.
   *
   * @param item
   */
  @action
  promoteToTop(item: TimeVarying) {
    var currentIndex = this.items.indexOf(item);
    if (currentIndex > -1) {
      this.addToTop(item);
    }
  }

  /**
   * Synchronizes all layers in the stack to the current time and the paused state of the provided clock.
   * Synchronizes the {@link TimelineStack#top} to the clock's `startTime`, `endTime`, and `multiplier`.
   * @param stratumId The stratum in which to modify properties.
   * @param clock The clock to sync to.
   */
  @action
  syncToClock(stratumId: string) {
    const clock = this.clock;
    const currentTime = JulianDate.toIso8601(clock.currentTime);
    const isPaused = !clock.shouldAnimate;

    if (this.top) {
      this.top.setTrait(
        stratumId,
        "startTime",
        JulianDate.toIso8601(clock.startTime)
      );
      this.top.setTrait(
        stratumId,
        "stopTime",
        JulianDate.toIso8601(clock.stopTime)
      );
      this.top.setTrait(stratumId, "multiplier", clock.multiplier);
    }

    for (let i = 0; i < this.items.length; ++i) {
      const layer = this.items[i];
      layer.setTrait(stratumId, "currentTime", currentTime);
      layer.setTrait(stratumId, "isPaused", isPaused);
    }
  }
}

function offsetIfUndefined(
  offsetSeconds: number,
  baseTime: JulianDate,
  time: JulianDate | undefined,
  result?: JulianDate
): JulianDate {
  if (time === undefined) {
    return JulianDate.addSeconds(
      baseTime,
      offsetSeconds,
      result || new JulianDate()
    );
  } else {
    return JulianDate.clone(time, result);
  }
}
