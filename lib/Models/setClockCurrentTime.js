'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');

/**
 * Set time to nearest time to specified (may be start or end of time range if time is not in range).
 * @param {ImageryLayerCatalogItem} catalogItem catalog item to set timeslider current time on
 * @param {JulianDate} date to set
 * @private
 */
function _setTimeIfInRange(catalogItem, timeToSet)
{
    if (JulianDate.lessThan(timeToSet, catalogItem._clock.startTime)) {
        catalogItem._clock.currentTime = catalogItem._clock.startTime.clone(catalogItem._clock.currentTime);
    }
    else if (JulianDate.greaterThan(timeToSet, catalogItem._clock.stopTime)) {
        catalogItem._clock.currentTime = catalogItem._clock.stopTime.clone(catalogItem._clock.currentTime);

    } else {
        catalogItem._clock.currentTime = timeToSet.clone(catalogItem._clock.currentTime);
    }
}

/**
 * Sets the current time of the clock, so the animation starts at a point which can be user defined.
 * Valid options in config file are:
 *     initialTimeSource: "present"                            // closest to today's date
 *     initialTimeSource: "start"                              // start of time range of animation
 *     initialTimeSource: "end"                                // end of time range of animation
 *     initialTimeSource: An ISO8601 date e.g. "2015-08-08"    // specified date or nearest if date is outside range
 * @param {ImageryLayerCatalogItem} catalogItem catalog item to set timeslider current time on
 * @private
 */
function setClockCurrentTime(catalogItem)
{
    // This is our default. Start at the nearest instant in time.
    var now = JulianDate.now();
    _setTimeIfInRange(catalogItem, now);

    var initialTimeSource = catalogItem.initialTimeSource;
    if (!defined(initialTimeSource)) {
        initialTimeSource = "present";
    }
    switch(initialTimeSource)
    {
        case "start":
            catalogItem._clock.currentTime = catalogItem._clock.startTime.clone(catalogItem._clock.currentTime);
            break;
        case "end":
            catalogItem._clock.currentTime = catalogItem._clock.stopTime.clone(catalogItem._clock.currentTime);
            break;
        case "present":
            // Set to present by default.
            break;
        default:
            // Note that if it's not an ISO8601 timestamp, it ends up being set to present.
            // Find out whether it's an ISO8601 timestamp.
            var timestamp;
            try {
                timestamp = JulianDate.fromIso8601(initialTimeSource);

                // Cesium no longer validates dates in the release build.
                // So convert to a JavaScript date as a cheesy means of checking if the date is valid.
                if (isNaN(JulianDate.toDate(timestamp))) {
                    throw new Error('Invalid Date');
                }
            }
            catch (e) {
                throw new TerriaError('Invalid initialTimeSource specified in config file: ' + initialTimeSource);
            }
            if (defined(timestamp))
            {
                _setTimeIfInRange(catalogItem, timestamp);
            }
    }
}

module.exports = setClockCurrentTime;
