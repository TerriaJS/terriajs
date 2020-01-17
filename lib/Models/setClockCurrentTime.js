"use strict";

/*global require*/
var defined = require("terriajs-cesium/Source/Core/defined").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var JulianDate = require("terriajs-cesium/Source/Core/JulianDate").default;

var TerriaError = require("../Core/TerriaError");
var i18next = require("i18next").default;

/**
 * Set time to nearest time to specified (may be start or end of time range if time is not in range).
 * @param {DataSourceClock} clock clock to set current time on.
 * @param {JulianDate} timeToSet the time to set
 * @param {JulianDate} [stopTime=clock.stopTime] The stop time to use instead of `clock.stopTime`. This is useful to
 *                     position the clock at the start of the final interval instead of at its end.
 * @private
 */
function _setTimeIfInRange(clock, timeToSet, stopTime) {
  stopTime = defaultValue(stopTime, clock.stopTime);

  if (JulianDate.lessThan(timeToSet, clock.startTime)) {
    clock.currentTime = clock.startTime.clone();
  } else if (JulianDate.greaterThan(timeToSet, stopTime)) {
    clock.currentTime = stopTime.clone();
  } else {
    clock.currentTime = timeToSet.clone();
  }
}

/**
 * Sets the current time of the clock, using a string defined specification for the time point to use.
 * @param {DataSourceClock} clock clock to set the current time on.
 * @param {String} initialTimeSource A string specifiying the value to use when setting the currentTime of the clock. Valid options are:
 *                 ("present": closest to today's date,
 *                  "start": start of time range of animation,
 *                  "end": end of time range of animation,
 *                  An ISO8601 date e.g. "2015-08-08": specified date or nearest if date is outside range).
 */
function setClockCurrentTime(clock, initialTimeSource, stopTime) {
  if (!defined(clock)) {
    return;
  }

  // This is our default. Start at the nearest instant in time.
  var now = JulianDate.now();
  _setTimeIfInRange(clock, now, stopTime);

  initialTimeSource = defaultValue(initialTimeSource, "present");
  switch (initialTimeSource) {
    case "start":
      clock.currentTime = clock.startTime.clone(clock.currentTime);
      break;
    case "end":
      clock.currentTime = clock.stopTime.clone(clock.currentTime);
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
          throw new Error(i18next.t("models.time.invalidDate"));
        }
      } catch (e) {
        throw new TerriaError(
          i18next.t("models.time.invalidDate", {
            initialTimeSource: initialTimeSource
          })
        );
      }
      if (defined(timestamp)) {
        _setTimeIfInRange(clock, timestamp);
      }
  }
}

module.exports = setClockCurrentTime;
