import CesiumClock from 'terriajs-cesium/Source/Core/Clock';
import { computed, action, observable, createAtom } from 'mobx';
import JulianDate from 'terriajs-cesium/Source/Core/JulianDate';
import freezeInDebug from '../Core/freezeInDebug';

export default class Clock {
    readonly cesiumClock = new CesiumClock({
        shouldAnimate: false,
    });

    private _tickAtom = createAtom('tick', () => this.startTicking(), () => this.stopTicking());
    private _removeTickListener: Cesium.Event.RemoveCallback | undefined;

    constructor() {
    }

    // Principles:
    // * Returned values must be immutable (mark them readonly and freeze them in debug builds)
    // * Values that can be changed behind the scenes should not be returned (copy them instead).

    @computed({ equals: JulianDate.equals })
    get currentTime(): Readonly<JulianDate> {
        this._tickAtom.reportObserved();
        return freezeInDebug(JulianDate.clone(this.cesiumClock.currentTime));
    }
    set currentTime(value: Readonly<JulianDate>) {
        this.cesiumClock.currentTime = JulianDate.clone(value, this.cesiumClock.currentTime);
        this._tickAtom.reportChanged();
    }

    @computed({ equals: JulianDate.equals })
    get startTime(): Readonly<JulianDate> {
        this._tickAtom.reportObserved();
        return freezeInDebug(JulianDate.clone(this.cesiumClock.startTime));
    }
    set startTime(value: Readonly<JulianDate>) {
        this.cesiumClock.startTime = JulianDate.clone(value, this.cesiumClock.startTime);
        this._tickAtom.reportChanged();
    }

    @computed({ equals: JulianDate.equals })
    get stopTime(): Readonly<JulianDate> {
        this._tickAtom.reportObserved();
        return freezeInDebug(JulianDate.clone(this.cesiumClock.stopTime));
    }
    set stopTime(value: Readonly<JulianDate>) {
        this.cesiumClock.stopTime = JulianDate.clone(value, this.cesiumClock.stopTime);
        this._tickAtom.reportChanged();
    }

    @computed
    get multiplier(): number {
        this._tickAtom.reportObserved();
        return this.cesiumClock.multiplier;
    }
    set multiplier(value: number) {
        this.cesiumClock.multiplier = value;
        this._tickAtom.reportChanged();
    }

    @computed
    get clockStep(): Cesium.ClockStep {
        this._tickAtom.reportObserved();
        return this.cesiumClock.clockStep;
    }
    set clockStep(value: Cesium.ClockStep) {
        this.cesiumClock.clockStep = value;
        this._tickAtom.reportChanged();
    }

    @computed
    get clockRange(): Cesium.ClockRange {
        this._tickAtom.reportObserved();
        return this.cesiumClock.clockRange;
    }
    set clockRange(value: Cesium.ClockRange) {
        this.cesiumClock.clockRange = value;
        this._tickAtom.reportChanged();
    }

    @computed
    get canAnimate(): boolean {
        this._tickAtom.reportObserved();
        return this.cesiumClock.canAnimate;
    }
    set canAnimate(value: boolean) {
        this.cesiumClock.canAnimate = value;
        this._tickAtom.reportChanged();
    }

    @computed
    get shouldAnimate(): boolean {
        this._tickAtom.reportObserved();
        return this.cesiumClock.shouldAnimate;
    }
    set shouldAnimate(value: boolean) {
        this.cesiumClock.shouldAnimate = value;
        this._tickAtom.reportChanged();
    }

    @action
    private onTick() {
        // This function will only be called if something is observing at least one of the properties above.

        // We aim to accomplish two things here:
        // * Update the cached property values on this instance to match the values on the Cesium clock.
        // * Raise change notifications for any changed properties.

        // TODO: Skip gaps in the intervals of the active catalog as our old Clock.js did.

        const cesiumClock = this.cesiumClock;
        this.currentTime = cesiumClock.currentTime;
        this.startTime = cesiumClock.startTime;
        this.stopTime = cesiumClock.stopTime;
        this.multiplier = cesiumClock.multiplier;
        this.clockStep = cesiumClock.clockStep;
        this.clockRange = cesiumClock.clockRange;
        this.canAnimate = cesiumClock.canAnimate;
        this.shouldAnimate = cesiumClock.shouldAnimate;
    }

    private startTicking() {
        this.stopTicking();
        this._removeTickListener = this.cesiumClock.onTick.addEventListener(this.onTick, this);
    }

    private stopTicking() {
        if (this._removeTickListener) {
            this._removeTickListener();
            this._removeTickListener = undefined;
        }
    }
}
