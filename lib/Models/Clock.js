"use strict";

var CesiumClock = require('terriajs-cesium/Source/Core/Clock');
var TimeInterval = require('terriajs-cesium/Source/Core/TimeInterval');
var inherit = require('../Core/inherit');
var defined = require('terriajs-cesium/Source/Core/defined');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');

/**
 * Extension of the standard Clock provided by Cesium customised to deal with Terria-level abstractions like
 * {@link CatalogItem}s.
 * @param options see {@link terriajs-cesium/Source/Core/Clock}
 * @constructor
 */
var Clock = function(options) {
    CesiumClock.call(this, options);

    this._currentTime = this.currentTime;

    Object.defineProperty(this, 'currentTime', {
        get: function() {
            return this._currentTime;
        },
        set: function(newTime) {
            var gap = this.determineGap(newTime);

            this._currentTime = defined(gap) ? gap.stop : newTime;
        }
    });
};

inherit(CesiumClock, Clock);

/**
 * Set the {@link CatalogItem} that this clock is currently tracking.
 *
 * @param {CatalogItem} item
 */
Clock.prototype.setCatalogItem = function(item) {
    this.catalogItem = item;

    item.clock.getValue(this);
};

/**
 * Determines whether the passed {@link JulianDate} occurs within a gap in the currently tracked {@link CatalogItem}'s
 * data. If so returns that gap as a {@link TimeInterval}, otherwise undefined.
 *
 * @param {JulianDate} date
 * @returns {TimeInterval} The gap in the data that the passed date falls within, if one exists.
 */
Clock.prototype.determineGap = function(date) {
    var intervals = this.catalogItem && this.catalogItem.intervals;

    if (defined(intervals)) {
        var matchingIntervalIndex = intervals.indexOf(date);

        // If an index can't be found, TimeIntervalCollection returns the (negative) bitwise complement of the next index after
        // where the date would fit...
        if (matchingIntervalIndex >= 0) {
            // ... so if it's >= 0 our date actually has an interval specified for it, return undefined.
            return;
        }

        // ... otherwise flip the bits back and use the index to figure out where the boundaries of our gap are.
        var gapEndIndex = ~matchingIntervalIndex;
        var gapStart, gapStop;
        if (gapEndIndex === 0) {
            gapStart = this.catalogItem.clock.startTime;
            gapStop = intervals.get(0).start;
        } else if (gapEndIndex === intervals.length) {
            gapStop = this.catalogItem.clock.stopTime;
        }

        return new TimeInterval({
            // using || instead of defaultValue because we don't want the default to execute if gapStart is truthy.
            start: gapStart || intervals.get(gapEndIndex - 1).stop,
            stop: gapStop || intervals.get(gapEndIndex).start,
            isStartIncluded: false,
            isStopIncluded: false
        });
    }
};

module.exports = Clock;
