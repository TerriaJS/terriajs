"use strict";

var CesiumClock = require('terriajs-cesium/Source/Core/Clock');
var TimeInterval = require('terriajs-cesium/Source/Core/TimeInterval');
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var inherit = require('../Core/inherit');

var Clock = function(options) {
    CesiumClock.call(this, options);
};

inherit(CesiumClock, Clock);

Clock.prototype.setCatalogItem = function(item) {
    this.catalogItem = item;

    item.clock.getValue(this);
};

Clock.prototype.tick = function() {
    var intervals = this.catalogItem && this.catalogItem.intervals;

    if (intervals) {
        // TODO: Binary search tree?
        for (var i = 1; i < intervals.length; i++) {
            var gapInterval = new TimeInterval({
                start: intervals.get(i - 1).stop,
                stop: intervals.get(i).start,
                isStartIncluded: false,
                isStopIncluded: false
            });

            if (TimeInterval.contains(gapInterval, this.currentTime)) {
                this.currentTime = JulianDate.clone(gapInterval.stop);
            }
        }
    }

    CesiumClock.prototype.tick.call(this);
};

module.exports = Clock;
