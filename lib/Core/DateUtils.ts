import dateFormat from "dateformat";
import DiscretelyTimeVaryingMixin from "../ModelMixins/DiscretelyTimeVaryingMixin";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";

/**
 * Returns the offset in minutes from UTC for a given timeZone string.
 * param timeZone - String in the format +/-HH:MM or +/-HH offset from UTC Zulu time.
 * returns The offset in minutes from UTC. as a number.
 */

export function getOffsetMinutes(timeZone: string): number {
  // use a regex to check if timeZone is in format +/-HH:MM
  const regexHHMM = new RegExp(/^([+-])(\d{2}):(\d{2})$/);
  const match = timeZone.match(regexHHMM);

  if (match) {
    const sign = match[1] === "-" ? -1 : 1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3], 10);
    return sign * (hours * 60 + minutes);
  } else {
    // use a regex to check if timeZone is in format +/-HH
    const regexHH = new RegExp(/^([+-])(\d{2})$/);
    const match = timeZone.match(regexHH);
    if (match) {
      const sign = match[1] === "-" ? -1 : 1;
      const hours = parseInt(match[2], 10);
      return sign * hours * 60;
    } else {
      return 0;
    }
  }
}

/**
 * Returns the adjusted time for a given ctalog item. Uses the traits from
 * DateTimeTraits.ts to determine how to adjust the date/time.
 * timeZone trait: is in the format +/-HH:MM or +/-HH offset from UTC Zulu time.
 * dateFormat trait: defines the display format of the time, see
 * https://github.com/felixge/node-dateformat for explanation of available formats.
 * isStaticDate: trait is a boolean that determines whether to adjust the time to the
 * users local time. if true, the time is not transformed to the local time.
 * param item - DiscretelyTimeVaryingMixin.Instance being loaded into workbench.
 * returns The adjusted time as string.
 */

export function getAdjustedTime(
  item: DiscretelyTimeVaryingMixin.Instance
): string {
  if (!item.currentDiscreteJulianDate) {
    return "";
  }

  let time = JulianDate.toDate(item.currentDiscreteJulianDate);

  if (item.timeZone) {
    const offset = getOffsetMinutes(item.timeZone);
    time = JulianDate.toDate(
      JulianDate.addMinutes(
        item.currentDiscreteJulianDate,
        offset,
        new JulianDate()
      )
    );
  }

  if (item.isStaticDate) {
    time = new Date(time.getTime() + time.getTimezoneOffset() * 60 * 1000);
  }

  const format = item.dateFormat || "isoDate";
  return dateFormat(time, format);
}
