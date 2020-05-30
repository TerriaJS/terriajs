import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import Model from "../Models/Model";
import TimeVaryingTraits from "../Traits/TimeVaryingTraits";

export default interface TimeVarying extends Model<TimeVaryingTraits> {
  readonly currentTimeAsJulianDate: JulianDate | undefined;
  readonly startTimeAsJulianDate: JulianDate | undefined;
  readonly stopTimeAsJulianDate: JulianDate | undefined;
}
