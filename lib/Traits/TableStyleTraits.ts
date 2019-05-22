import TableChartStyleTraits from "./TableChartStyleTraits";
import TableColorStyleTraits from "./TableColorStyleTraits";
import TableScaleStyleTraits from "./TableScaleStyleTraits";
import TableTimeStyleTraits from "./TableTimeStyleTraits";
import ModelTraits from "./ModelTraits";
import objectTrait from "./objectTrait";
import primitiveTrait from "./primitiveTrait";
import StratumFromTraits from "../Models/StratumFromTraits";

export default class TableStyleTraits extends ModelTraits {
  @primitiveTrait({
    name: "ID",
    description: "The ID of the style.",
    type: "string"
  })
  id?: string;

  @primitiveTrait({
    name: "Title",
    description:
      "The human-readable title of the style. Set this to null to remove the style entirely.",
    type: "string"
  })
  title?: string | null;

  @primitiveTrait({
    name: "Legend Title",
    description:
      "The title to show on the legend. If not specified, `Title` is used.",
    type: "string"
  })
  legendTitle?: string;

  @primitiveTrait({
    name: "Region Column",
    description: "The column to use for region mapping.",
    type: "string"
  })
  regionColumn?: string;

  @primitiveTrait({
    name: "Region Type",
    description: "The region type that the `Region Column` refers to.",
    type: "string"
  })
  regionType?: string;

  @primitiveTrait({
    name: "Latitude Column",
    description:
      "The column to use for the latitude of points. If `Region Column` is specified, this property is ignored.",
    type: "string"
  })
  latitudeColumn?: string;

  @primitiveTrait({
    name: "Longitude Column",
    description:
      "The column to use for the longitude of points. If `Region Column` is specified, this property is ignored.",
    type: "string"
  })
  longitudeColumn?: string;

  @objectTrait({
    name: "Color",
    description: "Options for controlling the color of points or regions.",
    type: TableColorStyleTraits
  })
  color?: TableColorStyleTraits;

  @objectTrait({
    name: "Scale",
    description: "Options for controlling the scale of points.",
    type: TableScaleStyleTraits
  })
  scale?: TableScaleStyleTraits;

  @objectTrait({
    name: "Chart",
    description: "Options for controlling the chart created from this CSV.",
    type: TableChartStyleTraits
  })
  chart?: TableChartStyleTraits;

  @objectTrait({
    name: "Time",
    description:
      "Options for controlling how the visualization changes with time.",
    type: TableChartStyleTraits
  })
  time?: TableTimeStyleTraits;

  static isRemoval(style: StratumFromTraits<TableStyleTraits>) {
    return style.title === null;
  }
}
