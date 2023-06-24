import CatalogMemberTraits from "./CatalogMemberTraits";
import mixTraits from "../mixTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class TimeVaryingTraits extends mixTraits(CatalogMemberTraits) {
  @primitiveTrait({
    name: "Time label",
    description: `Time label which is shown in workbench next to date/time selector (Will default to t("dateTime.selectorLabel") = "Time:").`,
    type: "string"
  })
  timeLabel?: string;

  @primitiveTrait({
    name: "Current Time",
    description: "The current time at which to show this dataset.",
    type: "string",
    isNullable: true
  })
  currentTime?: string | null;

  @primitiveTrait({
    name: "Initial Time Source",
    description:
      "The initial time to use if `Current Time` is not specified. Valid values are <br/>" +
      " * `start` - the dataset's start time <br/>" +
      " * `stop` - the dataset's stop time <br/>" +
      " * `now` - the current system time. If the system time is after `Stop Time`, `Stop Time` is used. If the system time is before `Start Time`, `Start Time` is used. <br/>" +
      " * `none` - do not automatically set an initial time <br/>" +
      " This value is ignored if `Current Time` is specified.",
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

  @primitiveTrait({
    name: "Date Format",
    description:
      "A dateformat string (using the dateformat package) used to adjust the presentation of the date in various spots in the UI for a catalog item. <br/>" +
      "For example, to just show the year set to 'yyyy'. Used in places like the the Workbench Item and Bottom Dock",
    type: "string"
  })
  dateFormat?: string;
}
