import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export class DateTimeTraits extends ModelTraits {
  @primitiveTrait({
    type: "boolean",
    name: "Is UTC Timezone",
    description:
      "If the DateTime attribute values do not have timezone information" +
      " (e.g. 2018-01-01T00:00:00), this flag indicates whether the values should be interpreted as UTC time."
  })
  isUTC?: boolean;

  @primitiveTrait({
    type: "string",
    name: "Timezone",
    description:
      "If the DateTime attribute values do not have timezone information" +
      " (e.g. 2018-01-01T00:00:00), specify the ISO timezone with offset from UTC (e.g. +10:00)"
  })
  timeZone?: string;
}
