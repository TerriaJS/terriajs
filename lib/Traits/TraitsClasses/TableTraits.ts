import CatalogMemberTraits from "./CatalogMemberTraits";
import ChartPointOnMapTraits from "./ChartPointOnMapTraits";
import DiscretelyTimeVaryingTraits from "./DiscretelyTimeVaryingTraits";
import ExportableTraits from "./ExportableTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "../mixTraits";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import RasterLayerTraits from "./RasterLayerTraits";
import SplitterTraits from "./SplitterTraits";
import TableColumnTraits from "./TableColumnTraits";
import TableStyleTraits from "./TableStyleTraits";

export default class TableTraits extends mixTraits(
  DiscretelyTimeVaryingTraits,
  ExportableTraits,
  LayerOrderingTraits,
  CatalogMemberTraits,
  MappableTraits,
  RasterLayerTraits,
  ChartPointOnMapTraits,
  CatalogMemberTraits
) {
  @primitiveTrait({
    name: "Show Warning for Unmatched Regions",
    description:
      "True to show a warning when some of the region IDs in the CSV file could not be matched to a region. False to silently ignore unmatched regions.",
    type: "boolean"
  })
  showUnmatchedRegionsWarning: boolean = true;

  @objectArrayTrait({
    name: "Columns",
    description: "Options for individual columns in the CSV.",
    type: TableColumnTraits,
    idProperty: "name"
  })
  columns?: TableColumnTraits[];

  @objectTrait({
    name: "Default Column",
    description: "The default settings to use for all columns",
    type: TableColumnTraits
  })
  defaultColumn?: TableColumnTraits;

  @objectArrayTrait({
    name: "Styles",
    description:
      "The set of styles that can be used to visualize this dataset.",
    type: TableStyleTraits,
    idProperty: "id"
  })
  styles?: TableStyleTraits[];

  @objectTrait({
    name: "Default Style",
    description:
      "The default style to apply when visualizing any column in this CSV.",
    type: TableStyleTraits
  })
  defaultStyle?: TableStyleTraits;

  @primitiveTrait({
    name: "Selected Style",
    description: "The ID of the currently-selected style.",
    type: "string"
  })
  activeStyle?: string;

  @primitiveTrait({
    name: "Enable manual region mapping",
    description:
      "If enabled, there will be controls to set region column and region type.",
    type: "boolean"
  })
  enableManualRegionMapping?: boolean;

  @primitiveArrayTrait({
    name: "Column titles",
    description:
      "An optional array of column titles that override the individual `TableColumnTraits.title` setting.",
    type: "string"
  })
  columnTitles: string[] = [];

  @primitiveArrayTrait({
    name: "Column units",
    description:
      "An optional array of column units that override the individual `TableColumnTraits.unit` setting.",
    type: "string"
  })
  columnUnits: string[] = [];

  @primitiveTrait({
    name: "Remove duplicate rows",
    type: "boolean",
    description:
      "If two rows in the table are identical, only retain one copy. This could cause performance issues, and so should be used only when absolutely necessary."
  })
  removeDuplicateRows: boolean = false;
}
