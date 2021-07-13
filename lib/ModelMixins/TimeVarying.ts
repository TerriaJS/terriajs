import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import Model, { BaseModel } from "../Models/Definition/Model";
import TimeVaryingTraits from "../Traits/TraitsClasses/TimeVaryingTraits";

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
