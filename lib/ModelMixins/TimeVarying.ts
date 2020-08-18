import Model, { BaseModel } from "../Models/Model";
import TimeVaryingTraits from "../Traits/TimeVaryingTraits";

interface TimeVarying extends Model<TimeVaryingTraits> {
  readonly currentTimeAsJulianDate: Cesium.JulianDate | undefined;
  readonly startTimeAsJulianDate: Cesium.JulianDate | undefined;
  readonly stopTimeAsJulianDate: Cesium.JulianDate | undefined;
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
