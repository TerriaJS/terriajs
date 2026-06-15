import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import Model, { BaseModel } from "../Models/Definition/Model";
import TimeVaryingTraits from "../Traits/TraitsClasses/TimeVaryingTraits";

/** To use as precision in JulianDate.toIso8601(date, precision) - so we don't get scientific/exponent in date string (eg `2008-05-07T22:54:45.7275957614183426e-11Z`).
 * Is set to nanosecond precision
 */
export const DATE_SECONDS_PRECISION = 9;

interface TimeVarying extends Model<TimeVaryingTraits> {
  readonly currentTimeAsJulianDate: JulianDate | undefined;
  readonly startTimeAsJulianDate: JulianDate | undefined;
  readonly stopTimeAsJulianDate: JulianDate | undefined;
}

namespace TimeVarying {
  export function is(model: BaseModel | TimeVarying): model is TimeVarying {
    return (
      "currentTimeAsJulianDate" in model &&
      "startTimeAsJulianDate" in model &&
      "stopTimeAsJulianDate" in model
    );
  }
}

export default TimeVarying;
