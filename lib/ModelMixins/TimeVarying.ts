import Model from "../Models/Model";
import TimeVaryingTraits from "../Traits/TimeVaryingTraits";

export default interface TimeVarying extends Model<TimeVaryingTraits> {
  readonly currentTimeAsJulianDate: Cesium.JulianDate | undefined;
  readonly startTimeAsJulianDate: Cesium.JulianDate | undefined;
  readonly stopTimeAsJulianDate: Cesium.JulianDate | undefined;
}
