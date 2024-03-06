import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import { traitClass } from "../Trait";
import mixTraits from "../mixTraits";
import AutoRefreshingTraits from "./AutoRefreshingTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import MappableTraits from "./MappableTraits";
import TimeVaryingTraits from "./TimeVaryingTraits";
import UrlTraits from "./UrlTraits";

@traitClass({
  description: `Creates one catalog item from url that points to a czml file.
  
  <strong>Note:</strong> If the model is not visible, try to disable the terrain by unchecking the box "Terrain hides underground features".`,
  example: {
    type: "czml",
    url: "https://tiles.terria.io/terriajs-examples/czml/smooth.czml",
    name: "czml example",
    id: "some unique ID"
  }
})
export default class CzmlCatalogItemTraits extends mixTraits(
  AutoRefreshingTraits,
  TimeVaryingTraits,
  UrlTraits,
  CatalogMemberTraits,
  LegendOwnerTraits,
  MappableTraits
) {
  @anyTrait({
    name: "CZML Data",
    description: "A CZML data array."
  })
  czmlData?: JsonObject[];

  @primitiveTrait({
    type: "string",
    name: "CZML String",
    description: "A CZML string."
  })
  czmlString?: string;
}
