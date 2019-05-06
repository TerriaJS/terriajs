import DiscreteTimeTraits from "./DiscreteTimeTraits";
import objectArrayTrait from "./objectArrayTrait";
import primitiveTrait from "./primitiveTrait";
import TimeVaryingTraits from "./TimeVaryingTraits";

export default class DiscretelyTimeVaryingTraits extends TimeVaryingTraits {
  @objectArrayTrait({
    name: "Discrete Times",
    description: "The discrete times at which this dataset is available.",
    type: DiscreteTimeTraits,
    idProperty: "time"
  })
  discreteTimes?: DiscreteTimeTraits[];

  @primitiveTrait({
    name: "Mapping from Continuous Time",
    description:
      "Specifies how a continuous time (e.g. the timeline control) is mapped to a discrete time for this dataset. Valid values are:\n\n" +
      "  * `nearest` - the nearest available discrete time to the current continuous time is used.\n" +
      "  * `next` - the discrete time equal to or after the current continuous time is used.\n" +
      "  * `previous` - the discrete time equal to or before the current continuous time is used.",
    type: "string"
  })
  fromContinuous: string = "nearest";
}
