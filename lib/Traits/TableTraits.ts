import CatalogMemberTraits from "./CatalogMemberTraits";
import TableColumnTraits from "./TableColumnTraits";
import TableStyleTraits from "./TableStyleTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "./mixTraits";
import objectArrayTrait from "./objectArrayTrait";
import objectTrait from "./objectTrait";
import primitiveTrait from "./primitiveTrait";
import RasterLayerTraits from "./RasterLayerTraits";
import TimeVaryingTraits from "./TimeVaryingTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";

export default class TableTraits extends mixTraits(
  LayerOrderingTraits,
  CatalogMemberTraits,
  TimeVaryingTraits,
  MappableTraits,
  RasterLayerTraits
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
}
