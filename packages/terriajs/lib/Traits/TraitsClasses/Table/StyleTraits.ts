import StratumFromTraits from "../../../Models/Definition/StratumFromTraits";
import objectTrait from "../../Decorators/objectTrait";
import primitiveTrait from "../../Decorators/primitiveTrait";
import ModelTraits from "../../ModelTraits";
import TableChartStyleTraits from "./ChartStyleTraits";
import TableColorStyleTraits from "./ColorStyleTraits";
import TableLabelStyleTraits from "./LabelStyleTraits";
import TableOutlineStyleTraits from "./OutlineStyleTraits";
import TablePointSizeStyleTraits from "./PointSizeStyleTraits";
import TablePointStyleTraits from "./PointStyleTraits";
import TableTrailStyleTraits from "./TrailStyleTraits";
import TableTimeStyleTraits from "./TimeStyleTraits";

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
    type: "string",
    isNullable: true
  })
  title?: string | null;

  @primitiveTrait({
    name: "Region Column",
    description: "The column to use for region mapping.",
    type: "string",
    isNullable: true
  })
  regionColumn?: string | null;

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
    name: "Color",
    description:
      "Options for controlling the symbolization. This excludes color (see TableColorStyleTraits) and pointSize (see TablePointSizeStyleTraits).",
    type: TablePointStyleTraits
  })
  point: TablePointStyleTraits = new TablePointStyleTraits();

  @objectTrait({
    name: "Color",
    description:
      "Options for controlling the symbolization. This excludes color (see TableColorStyleTraits) and pointSize (see TablePointSizeStyleTraits).",
    type: TableOutlineStyleTraits
  })
  outline: TableOutlineStyleTraits = new TableOutlineStyleTraits();

  @objectTrait({
    name: "Point trail",
    description:
      "Options for controlling the trail or path behind a time-series point.",
    type: TableTrailStyleTraits
  })
  trail: TableTrailStyleTraits = new TableTrailStyleTraits();

  @objectTrait({
    name: "Label",
    description: "Options for controlling the labels.",
    type: TableLabelStyleTraits
  })
  label: TableLabelStyleTraits = new TableLabelStyleTraits();

  @objectTrait({
    name: "Point Size",
    description:
      "Options for controlling the size of points. This property is ignored for regions. This will override TablePointStyleTraits marker width/height if `pointSize.column` can be resolved to scalar column",
    type: TablePointSizeStyleTraits
  })
  pointSize?: TablePointSizeStyleTraits;

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
    type: TableTimeStyleTraits
  })
  time?: TableTimeStyleTraits;

  @primitiveTrait({
    name: "Hide style",
    description: `Hide style from "Display Variable" drop-down in workbench. It is hidden by default if number of colors (enumColors or numberOfBins) is less than 2 - as a ColorMap with a single color isn't super useful`,
    type: "boolean"
  })
  hidden?: boolean;

  static isRemoval(style: StratumFromTraits<TableStyleTraits>) {
    return style.title === null;
  }
}
