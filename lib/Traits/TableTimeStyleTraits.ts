import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";
import primitiveArrayTrait from "./primitiveArrayTrait";

export default class TableTimeStyleTraits extends ModelTraits {
  @primitiveTrait({
    name: "Time Column",
    description:
      "The column that indicates the time of a sample or the start time of an interval.",
    type: "string",
    isNullable: true
  })
  timeColumn?: string | null;

  @primitiveTrait({
    name: "End Time Column",
    description: "The column that indicates the end time of an interval.",
    type: "string"
  })
  endTimeColumn?: string;

  @primitiveArrayTrait({
    name: "ID Columns",
    description: "The columns that identify an entity as it changes over time.",
    type: "string"
  })
  idColumns?: string[];

  @primitiveTrait({
    name: "Is Sampled",
    description:
      'True if the rows in this CSV correspond to "sampled" data, and so ' +
      "the feature position, color, and size should be interpolated to produce " +
      "smooth animation of the features over time. If False, then times are " +
      "treated as the start of discrete periods and feature positions, colors, and " +
      "sizes are kept constant until the next time. This value is ignored " +
      "if the CSV does not have both a time column and an ID column.",
    type: "boolean"
  })
  isSampled: boolean = true;

  @primitiveTrait({
    name: "Display Duration",
    type: "number",
    description: "Display duration for each row in the table, in minutes."
  })
  displayDuration?: number;
}
