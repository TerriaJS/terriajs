import primitiveTrait from "./primitiveTrait";
import mixTraits from "./mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import MappableTraits from "./MappableTraits";

export default class TimeVaryingTraits extends mixTraits(
  CatalogMemberTraits,
  MappableTraits
) {
  @primitiveTrait({
    name: "Current Time",
    description: "The current time at which to show this dataset.",
    type: "string"
  })
  currentTime?: string;

  @primitiveTrait({
    name: "Initial Time Source",
    description:
      "The initial time to use if `Current Time` is not specified. Valid values are:\n\n" +
      "  * `start` - the dataset's start time\n" +
      "  * `stop` - the dataset's stop time\n" +
      "  * `now` - the current system time. If the system time is after `Stop Time`, `Stop Time` is used. If the system time is before `Start Time`, `Start Time` is used.\n\n" +
      "This value is ignored if `Current Time` is specified",
    type: "string"
  })
  initialTimeSource: string = "now";

  @primitiveTrait({
    name: "Start Time",
    description:
      "The earliest time for which this dataset is available. This will be the start of the range shown on the timeline control.",
    type: "string"
  })
  startTime?: string;

  @primitiveTrait({
    name: "Stop Time",
    description:
      "The latest time for which this dataset is available. This will be the end of the range shown on the timeline control.",
    type: "string"
  })
  stopTime?: string;

  @primitiveTrait({
    name: "Time Multiplier",
    description:
      "The multiplier to use in progressing time for this dataset. For example, `5.0` means that five seconds of dataset time will pass for each one second of real time.",
    type: "number"
  })
  multiplier?: number;

  @primitiveTrait({
    name: "Is Paused",
    description:
      "True if time is currently paused for this dataset, or false if it is progressing.",
    type: "boolean"
  })
  isPaused: boolean = true;
}
