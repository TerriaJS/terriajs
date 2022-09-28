import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import CkanSharedTraits from "./CkanSharedTraits";
import GroupTraits from "./GroupTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import UrlTraits from "./UrlTraits";

export default class CkanCatalogGroupTraits extends mixTraits(
  GroupTraits,
  UrlTraits,
  CatalogMemberTraits,
  LegendOwnerTraits,
  CkanSharedTraits
) {
  @anyTrait({
    name: "Filter Query",
    description: `Gets or sets the filter query to pass to CKAN when querying the available data sources and their groups. Each item in the
         * array causes an independent request to the CKAN, and the results are concatenated.  The
         * search string is equivalent to what would be in the parameters segment of the url calling the CKAN search api.
         * See the [Solr documentation](http://wiki.apache.org/solr/CommonQueryParameters#fq) for information about filter queries.
         * Each item is an object ({ fq: 'res_format:wms' }). For robustness sake, a query string is also allowed. E.g.
         * "fq=(res_format:wms OR res_format:WMS)" and "fq=+(res_format%3Awms%20OR%20res_format%3AWMS)" are allowed.
         *   To get all the datasets with wms resources: [{ fq: 'res_format%3awms' }]
         *   To get all wms/WMS datasets in the Surface Water group: [{q: 'groups=Surface Water', fq: 'res_format:WMS' }]
         *   To get both wms and esri-mapService datasets: [{q: 'res_format:WMS'}, {q: 'res_format:"Esri REST"' }]
         *   To get all datasets with no filter, you can use ['']
       `
  })
  filterQuery?: (JsonObject | string)[] = [
    {
      fq: '(res_format:(czml OR CZML OR geojson OR GeoJSON OR WMS OR wms OR kml OR KML OR kmz OR KMZ OR WFS OR wfs OR CSV-GEO-AU OR csv-geo-au OR "Esri REST"))'
    }
  ];

  @primitiveTrait({
    type: "string",
    name: "Group By",
    description: `Gets or sets a value indicating how datasets should be grouped.  Valid values are:
     * none - Datasets are put in a flat list; they are not grouped at all.
     * group - Datasets are grouped according to their CKAN group.  Datasets that are not in any groups are put at the top level.
     * organization - Datasets are grouped by their CKAN organization.  Datasets that are not associated with an organization are put at the top level.
     `
  })
  groupBy?: "organization" | "group" | "none" = "organization";

  @primitiveTrait({
    type: "string",
    name: "Ungrouped title",
    description: `A title for the group holding all items that don't have a group in CKAN.
      If the value is a blank string or undefined, these items will be left at the top level, not grouped.`
  })
  ungroupedTitle: string = "No group";

  @primitiveTrait({
    type: "boolean",
    name: "Allow entire WMS Servers",
    description:
      "True to allow entire WMS servers (that is, WMS resources without a clearly-defined layer) to be added to the catalog; otherwise, false."
  })
  allowEntireWmsServers: boolean = true;

  @primitiveTrait({
    type: "boolean",
    name: "Exclude inactive datasets",
    description: `True to remove inactive datasets. Where \`state = "deleted"\` (CKAN official), \`state === "draft"\` (CKAN official) or \`data_state === "inactive"\` (Data.gov.au CKAN).`
  })
  excludeInactiveDatasets: boolean = true;
}
