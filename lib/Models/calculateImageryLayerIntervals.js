"use strict";

var defined = require("terriajs-cesium/Source/Core/defined").default;
var JulianDate = require("terriajs-cesium/Source/Core/JulianDate").default;
var TimeInterval = require("terriajs-cesium/Source/Core/TimeInterval").default;

/**
 * Calculates intervals (near the current time) over which the values from the timeColumn do not change.
 *
 * This function will return .null for .nextInterval if we are in the last interval and cyclic is false.
 *
 * @param {*} timeColumn The time column containging the time intervals.
 * @param {JulianDate} currentTime The current time to compute the current and next intervals for.
 * @param {Boolean} animateForwards Whether we are currently animating forwards (true) or backwards (false) (this defines which direction .nextInterval will be in).
 * @param {Boolean} cyclic Whether we are animating cyclicly (if nextInterval falls beyond the end of the data, do we return .nextInterval as the first interval). The default for this value if not supplied is true.
 * @return {Object} A structure with a TimeInterval for .currentInterval and .nextInterval defining periods where the values from timeColumn are static.
 * @private
 */
function calculateImageryLayerIntervals(
  timeColumn,
  currentTime,
  animateForwards,
  cyclic
) {
  // Note: For this function we consider the case when isStartIncluded/isStopIncluded applies to the time. There is a
  // duality between isStartIncluded and isStopIncluded, that is: isStartIncluded === true for one interval implies
  // isStopIncluded === false for the adjacent time interval and vice versa. To simplify the logic in this function
  // for the main logic section we always consider the case isStartIncluded, this simplifies the logic and
  // understanding (only reverting to .isStartIncluded / isStopIncluded when we create the return structure).
  // We define a structure with the property .time (corresponding to the start time of an interval)
  // and property .included which is synomous with .isStartIncluded. The corresponding end times for the
  // preceeding adjacent interval are the same .time value and .isStopIncluded = !.isStartIncluded. In this way the
  // one structure can represent both the start time of one interval and the stop time of the preceeding interval, as
  // such we refer to these as marker locations, rather then start / stop times for intervals. This also gives rise
  // to the notion that .isIncluded true < false (where here < can be a synomym for 'before'), since the intstant
  // .isStartIncluded = true occurs before .isStartIncluded = false (to restate in a different way, all times that
  // are included when .isStartIncluded is false are included when .isStartIncluded is true, but the inverse is not
  // true, for all instances where .isStartIncluded is true you can't say .isStartIncluded can be false).

  // We need to keep track of 5 marker times:
  // - past: The closest transition time in the past (for current interval)
  // - future1: The closest transition time in the future (for current & next intervals)
  // - future2: The next closest transition time in the future (for next interval)
  // - absFirstStart: The absolute first transition, (the start of the absolute first interval) (only used when we are using cyclic mode and want to loop from the end back to the start).
  // - absFirstEnd: The absolute second transition, (the end of the absolute first interval) (only used when we are using cyclic mode and want to loop from the end back to the start).
  // We refer to the following as markers as they define the point where we change from one interval to the next.
  // .time applies to both the stop time for the previous interval and the start time for the interval begining from
  // the marker. .isIncluded refers to .isStartIncluded for the the interval beginning from the marker, and therefore
  // means that the .isStopIncluded for the preceeding interval is !.included.
  var past = { time: null, included: false };
  var future1 = { time: null, included: false };
  var future2 = { time: null, included: false };
  var absFirstStart = { time: null, included: false };
  var absFirstEnd = { time: null, included: false };

  // Before and after are defined according to animation direction:
  var isBeforeCondition = animateForwards
    ? JulianDate.lessThan
    : JulianDate.greaterThan;
  var isAfterCondition = animateForwards
    ? JulianDate.greaterThan
    : JulianDate.lessThan;
  var isBefore = (time, marker) =>
    marker.time === null ||
    isBeforeCondition(time.time, marker.time) ||
    (JulianDate.equals(time.time, marker.time) &&
      iib(time.included) &&
      iib(!marker.included));
  var isAfter = (time, marker) =>
    marker.time === null ||
    isAfterCondition(time.time, marker.time) ||
    (JulianDate.equals(time.time, marker.time) &&
      iib(!time.included) &&
      iib(marker.included));
  var equals = (time, marker) =>
    JulianDate.equals(time.time, marker.time) &&
    time.included === marker.included;
  // We use the acronym iib - InvertIfBackwards, which is in controdiction to the style guide, but makes the
  // expressions where it is used significantly more reable because of the short length which allows the expression
  // to be parsed more simply then the more verbose full name. When reading for the first pass ignore iib's effect
  // on the logic and then once you understand you can come back and review how iib() makes the expressions work
  var iib = value => (animateForwards ? value : !value);

  // Loop over time intervals and generate a time interval for the current and next imagery layer
  timeColumn.timeIntervals.forEach(function(interval) {
    if (!defined(interval)) {
      return;
    }

    // Here we convert from .isStopIncluded to the equvilent .isStartIncluded (by inverting) for implicit start for the next interval to simplify the remainder of the logic.
    [
      { time: interval.start, included: interval.isStartIncluded },
      { time: interval.stop, included: !interval.isStopIncluded }
    ].forEach(time => {
      // If time marker is AFTER to currentTime (also dealing with the equal edge case and disambiguating based on .isIncluded to provide a strict AFTER constraint).
      if (
        isAfterCondition(time.time, currentTime) ||
        (JulianDate.equals(time.time, currentTime) && iib(!time.included))
      ) {
        if (isBefore(time, future1)) {
          // If we have already got a future1 case then move it into future2, since this case is before the future case we have.
          if (future1.time !== null) {
            future2 = future1;
          }
          future1 = time;
        } else if (equals(time, future1)) {
          // We have already recorded this case (it is a duplicate of a previous case)...don't need to do anything.
        } else if (isBefore(time, future2)) {
          future2 = time;
        }
      } else if (isAfter(time, past)) {
        // This time marker is before the current time. If this marker is after the previous past marker we update it.
        past = time;
      }

      // If we are computing the cyclic nextInterval then produce values for the absolute first time interval incase we need to use them.
      if (cyclic !== false) {
        if (isBefore(time, absFirstStart)) {
          // If we have already got a absFirstStart case then move it into absFirstEnd, since this case is before the case we already have.
          if (absFirstStart.time !== null) {
            absFirstEnd = absFirstStart;
          }
          absFirstStart = time;
        } else if (equals(time, absFirstStart)) {
          // We have already recorded this case (it is a duplicate of a previous case)...don't need to do anything.
        } else if (isBefore(time, absFirstEnd)) {
          absFirstEnd = time;
        }
      }
    });
  });

  var intervalFromDatePair = (date1, date2, date1IsIncluded, date2IsIncluded) =>
    animateForwards
      ? new TimeInterval({
          start: date1,
          stop: date2,
          isStartIncluded: date1IsIncluded,
          isStopIncluded: date2IsIncluded
        })
      : new TimeInterval({
          start: date2,
          stop: date1,
          isStartIncluded: iib(date2IsIncluded),
          isStopIncluded: iib(date1IsIncluded)
        });

  // Here we disambiguate from .included into .isStartIncluded and .isStopIncluded specifically (note specifiically the inversion on the .isStopIncluded cases).
  var result = {
    currentInterval:
      past.time && future1.time
        ? intervalFromDatePair(
            past.time,
            future1.time,
            past.included,
            !future1.included
          )
        : null,
    nextInterval:
      future1.time && future2.time
        ? intervalFromDatePair(
            future1.time,
            future2.time,
            future1.included,
            !future2.included
          )
        : null
  };

  if (cyclic !== false) {
    // If there is no next time (because we are at the end, then use the first interval).
    if (future2.time === null) {
      result.nextInterval = intervalFromDatePair(
        absFirstStart.time,
        absFirstEnd.time,
        absFirstStart.included,
        !absFirstEnd.included
      );
    }
  }

  return result;
}

module.exports = calculateImageryLayerIntervals;
