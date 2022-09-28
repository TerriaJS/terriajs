import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import MappableTraits from "./MappableTraits";
import SplitterTraits from "./SplitterTraits";
import StyleTraits from "./StyleTraits";
import UrlTraits from "./UrlTraits";

export default class SenapsLocationsCatalogItemTraits extends mixTraits(
  SplitterTraits,
  MappableTraits,
  CatalogMemberTraits,
  LegendOwnerTraits,
  UrlTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Location ID Filter",
    description: `
    A string to filter locations using the id field, locations matching the filter will be included,
    multiple filters can be seperated using a comma, eg "*boorowa*,*environdata*"
    `
  })
  locationIdFilter?: string;

  @primitiveTrait({
    type: "string",
    name: "Stream ID Filter",
    description: `
    A string to filter streams using the id field, streams matching the filter will be included,
    multiple filters can be seperated using a comma, eg "*SHT31DIS_ALL*,*environdata*"
    `
  })
  streamIdFilter?: string;

  @objectTrait({
    type: StyleTraits,
    name: "Style",
    description:
      "Styling rules that follow [simplestyle-spec](https://github.com/mapbox/simplestyle-spec)"
  })
  style?: StyleTraits;
}
