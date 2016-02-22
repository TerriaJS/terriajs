"use strict";

var CesiumClock = require('terriajs-cesium/Source/Core/Clock');
var TimeInterval = require('terriajs-cesium/Source/Core/TimeInterval');
var inherit = require('../Core/inherit');
var defined = require('terriajs-cesium/Source/Core/defined');

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
    var intervals = defined(this.catalogItem) && this.catalogItem.intervals;

    if (defined(intervals)) {
        var matchingInterval = intervals.findIntervalContainingDate(date);

        if (defined(matchingInterval)) {
            return;
        }


        // TODO: This gets called a lot and runs in O(n) starting from index 0 every time. Could we start searching from
        // the last interval outwards? Use a binary search tree?
        for (var i = 1; i < intervals.length; i++) {
            var gapInterval = new TimeInterval({
                start: intervals.get(i - 1).stop,
                stop: intervals.get(i).start,
                isStartIncluded: false,
                isStopIncluded: false
            });

            if (TimeInterval.contains(gapInterval, date)) {
                return gapInterval;
            }
        }
    }
};

module.exports = Clock;
