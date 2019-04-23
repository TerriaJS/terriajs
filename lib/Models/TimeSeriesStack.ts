import { action, computed, observable, autorun, IReactionDisposer } from "mobx";
import { BaseModel } from "./Model";
import TimeVarying from "../ModelMixins/TimeVarying";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import CommonStrata from "./CommonStrata";

/**
 * Manages a stack of all the time series layers currently being shown and makes sure the clock provided is always tracking
 * the highest one. When the top-most layer is disabled, the clock will track the next highest in the stack. Provides access
 * to the current top layer so that can be displayed to the user.
 *
 * @param clock The clock that should track the highest layer.
 * @constructor
 */
export default class TimeSeriesStack {
    /**
     * The stratum of each layer in the stack in which to store the current time as the clock ticks.
     */
    tickStratumId: string = CommonStrata.user;

    @observable
    private readonly _layerStack: TimeVarying[] = [];

    private _disposeClockAutorun: IReactionDisposer;
    private _disposeTickSubscription: Cesium.Event.RemoveCallback;

    constructor(readonly clock: Cesium.Clock) {
        // Keep the Cesium clock in sync with the top layer's clock.
        this._disposeClockAutorun = autorun(() => {
            const topLayer = this.topLayer;
            if (!topLayer || !topLayer.currentTimeAsJulianDate) {
                this.clock.shouldAnimate = false;
                return;
            }

            this.clock.currentTime = JulianDate.clone(topLayer.currentTimeAsJulianDate, this.clock.currentTime);
            this.clock.startTime = offsetIfUndefined(-43200.0, topLayer.currentTimeAsJulianDate, topLayer.startTimeAsJulianDate, this.clock.startTime);
            this.clock.stopTime = offsetIfUndefined(43200.0, topLayer.currentTimeAsJulianDate, topLayer.stopTimeAsJulianDate, this.clock.stopTime);
            if (topLayer.multiplier !== undefined) {
                this.clock.multiplier = topLayer.multiplier;
            } else {
                this.clock.multiplier = 60.0;
            }
            this.clock.shouldAnimate = !topLayer.isPaused;
        });

        this._disposeTickSubscription = this.clock.onTick.addEventListener(() => {
            this.syncLayersToClockCurrentTime(this.tickStratumId);
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
     * The topmost time-series layer that has a valid `currentTime` and that is not using its own clock, or undefined if there
     * is no such layer in the stack.
     */
    @computed
    get topLayer(): TimeVarying | undefined {
        // Find the topmost layer that has a current time and that is not using its own clock.
        for (let i = this._layerStack.length - 1; i >= 0; --i) {
            const layer = this._layerStack[i];
            if (layer.currentTimeAsJulianDate !== undefined && !layer.useOwnClock) {
                return layer;
            }
        }
        return undefined;
    }

    /**
     * Adds the supplied {@link CatalogItem} to the top of the stack. If the item is already in the stack, it will be moved
     * rather than added twice.
     *
     * @param item
     */
    @action
    addLayerToTop(item: TimeVarying) {
        var currentIndex = this._layerStack.indexOf(item);
        this._layerStack.push(item);
        if (currentIndex > -1) {
            this._layerStack.splice(currentIndex, 1);
        }
    }

    /**
     * Removes a layer from the stack, no matter what its location. If the layer is currently at the top, the value of
     * {@link TimeSeriesStack#topLayer} will change.
     *
     * @param item;
     */
    @action
    removeLayer(item: TimeVarying) {
        var index = this._layerStack.indexOf(item);
        this._layerStack.splice(index, 1);
    }

    /**
     * Promotes the supplied {@link CatalogItem} to the top of the stack if it is already in the stack. If the item is not
     * already in the stack it won't be added.
     *
     * @param item
     */
    @action
    promoteLayerToTop(item: TimeVarying) {
        var currentIndex = this._layerStack.indexOf(item);
        if (currentIndex > -1) {
            this.addLayerToTop(item);
        }
    }

    /**
     * Synchronizes all layers in the stack to the current time of the {@link TimeSeriesStack#clock}.
     * @param stratumId
     */
    @action
    syncLayersToClockCurrentTime(stratumId: string) {
        const currentTime = JulianDate.toIso8601(this.clock.currentTime);
        for (let i = 0; i < this._layerStack.length; ++i) {
            const layer = this._layerStack[i];
            if (!layer.useOwnClock) {
                layer.setTrait(stratumId, 'currentTime', currentTime);
            }
        }
    }
}

function offsetIfUndefined(offsetSeconds: number, baseTime: JulianDate, time: JulianDate | undefined, result?: JulianDate): JulianDate {
    if (time === undefined) {
        return JulianDate.addSeconds(baseTime, offsetSeconds, result || new JulianDate);
    } else {
        return JulianDate.clone(time, result);
    }
}
