import ArcGisPortalSharedTraits from "./ArcGisPortalSharedTraits";
import CatalogMemberReferenceTraits from "./CatalogMemberReferenceTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "../mixTraits";
import primitiveTrait from "../Decorators/primitiveTrait";
import UrlTraits from "./UrlTraits";
import { traitClass } from "../Trait";

@traitClass({
  description: `Creates an item or group that referehces an item in ArcGIS portal.
  <strong>Note:</strong> 
  <li>The <code>itemId</code> in the example is the referenced item's ID in the portal.</li>
  <li>Not all referenced items can be added to the map. E.g., some types need conversions.</li>`,
  example: {
    type: "arcgis-portal-item",
    itemId: "084c61c6dd404517bc2db69079ddec38",
    name: "NSW Administrative Theme",
    url: "https://portal.spatial.nsw.gov.au/portal",
    id: "some id"
  }
})
export default class ArcGisPortalItemTraits extends mixTraits(
  UrlTraits,
  MappableTraits,
  CatalogMemberReferenceTraits,
  ArcGisPortalSharedTraits
) {
  @primitiveTrait({
    name: "Item ID",
    description: "The ID of the portal item.",
    type: "string"
  })
  itemId?: string;
}
