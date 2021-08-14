import moment from "moment";
import StratumFromTraits from "../Models/Definition/StratumFromTraits";
import DiscreteTimeTraits from "../Traits/TraitsClasses/DiscreteTimeTraits";

export default function createDiscreteTimesFromIsoSegments(
  result: StratumFromTraits<DiscreteTimeTraits>[],
  startDate: string,
  stopDate: string,
  isoDuration: string | undefined,
  maxRefreshIntervals: number
) {
  // Note parseZone will create a moment with the original specified UTC offset if there is one,
  // but if not, it will create a moment in UTC.
  const start = moment.parseZone(startDate);
  const stop = moment.parseZone(stopDate);

  // Note WMS uses extension ISO19128 of ISO8601; ISO 19128 allows start/end/periodicity
  // and does not use the "R[n]/" prefix for repeated intervals
  // eg. Data refreshed every 30 min: 2000-06-18T14:30Z/2000-06-18T14:30Z/PT30M
  // See 06-042_OpenGIS_Web_Map_Service_WMS_Implementation_Specification.pdf section D.4
  let duration: moment.Duration | undefined;
  if (isoDuration && isoDuration.length > 0) {
    duration = moment.duration(isoDuration);
  }

  // If we don't have a duration, or the duration is zero, then assume this is
  // a continuous interval for which it's valid to request _any_ time. But
  // we need to generate some discrete times, so choose an appropriate
  // periodicity.
  if (
    duration === undefined ||
    !duration.isValid() ||
    duration.asSeconds() === 0.0
  ) {
    const spanMilliseconds = stop.diff(start);

    // These times, in milliseconds, are approximate;
    const second = 1000;
    const minute = 60 * second;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 31 * day;
    const year = 366 * day;
    const decade = 10 * year;

    if (spanMilliseconds <= 1000) {
      duration = moment.duration(1, "millisecond");
    } else if (spanMilliseconds <= 1000 * second) {
      duration = moment.duration(1, "second");
    } else if (spanMilliseconds <= 1000 * minute) {
      duration = moment.duration(1, "minute");
    } else if (spanMilliseconds <= 1000 * hour) {
      duration = moment.duration(1, "hour");
    } else if (spanMilliseconds <= 1000 * day) {
      duration = moment.duration(1, "day");
    } else if (spanMilliseconds <= 1000 * week) {
      duration = moment.duration(1, "week");
    } else if (spanMilliseconds <= 1000 * month) {
      duration = moment.duration(1, "month");
    } else if (spanMilliseconds <= 1000 * year) {
      duration = moment.duration(1, "year");
    } else if (spanMilliseconds <= 1000 * decade) {
      duration = moment.duration(10, "year");
    } else {
      duration = moment.duration(100, "year");
    }
  }

  let current = start.clone();
  let count = 0;

  // Add intervals starting at start until:
  //    we go past the stop date, or
  //    we go past the max limit
  while (
    current &&
    current.isSameOrBefore(stop) &&
    count < maxRefreshIntervals
  ) {
    result.push({
      time: formatMomentForWms(current, duration),
      tag: undefined
    });
    current.add(duration);
    ++count;
  }

  if (count >= maxRefreshIntervals) {
    console.warn(
      "Interval has more than the allowed number of discrete times. Consider setting `maxRefreshIntervals`."
    );
  } else if (!current.isSame(stop)) {
    result.push({
      time: formatMomentForWms(stop, duration),
      tag: undefined
    });
  }
}

function formatMomentForWms(m: moment.Moment, duration: moment.Duration) {
  // If the original moment only contained a date (not a time), and the
  // duration doesn't include hours, minutes, or seconds, format as a date
  // only instead of a date+time.  Some WMS servers get confused when
  // you add a time on them.
  if (
    duration.hours() > 0 ||
    duration.minutes() > 0 ||
    duration.seconds() > 0 ||
    duration.milliseconds() > 0
  ) {
    return m.format();
  } else {
    const creationData = m.creationData();
    if (creationData) {
      const format = creationData.format;
      if (typeof format === "string" && format.indexOf("T") < 0) {
        return m.format(format);
      }
    }
  }

  return m.format();
}
