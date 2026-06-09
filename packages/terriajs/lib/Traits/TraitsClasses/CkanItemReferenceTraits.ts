import CkanSharedTraits from "./CkanSharedTraits";
import CatalogMemberReferenceTraits from "./CatalogMemberReferenceTraits";
import mixTraits from "../mixTraits";
import MappableTraits from "./MappableTraits";
import primitiveTrait from "../Decorators/primitiveTrait";
import UrlTraits from "./UrlTraits";
import { traitClass } from "../Trait";

@traitClass({
  description: `Creates a calalog item that references a ckan item.

  <strong>Note:</strong> 
  <li>The property <code>resourceId</code> in the example below is a Ckan resource Id that references a geospatial type (wms) data.</li>`,
  example: {
    url: "https://discover.data.vic.gov.au",
    type: "ckan-item",
    resourceId: "22b8cf52-4583-4609-a3da-a6e1805829d9",
    name: "A Ckan Item (WMS)",
    id: "some id"
  }
})
export default class CkanCatalogItemTraits extends mixTraits(
  UrlTraits,
  MappableTraits,
  CkanSharedTraits,
  CatalogMemberReferenceTraits
) {
  @primitiveTrait({
    name: "Dataset ID",
    description: "The CKAN ID of the dataset.",
    type: "string"
  })
  datasetId?: string;

  @primitiveTrait({
    name: "Magda Record Data",
    description: "The Resource ID of the dataset to use",
    type: "string"
  })
  resourceId?: string;
}
