import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export class DateTimeTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Timezone",
    description:
      "If the DateTime attribute values do not have timezone information" +
      " (e.g. 2018-01-01T00:00:00), specify the ISO timezone with offset from UTC (e.g. +10:00)"
  })
  timeZone?: string;

  @primitiveTrait({
    type: "string",
    name: "Date format",
    description:
      "See available formats here https://github.com/felixge/node-dateformat"
  })
  dateFormat?: string;
}

export default DateTimeTraits;
