import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import CkanSharedTraits from "./CkanSharedTraits";
import GroupTraits from "./GroupTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import UrlTraits from "./UrlTraits";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import { traitClass } from "../Trait";

@traitClass({
  description: `Creates a group with members from Ckan server.

  <strong>Note:</strong> 
  <br>The following example will</br>
  <li>Request datasets of specific types only.</li>
  <li>Organise members in subgroups according to their organisations.</li>
  <li>For any wms type item, use ESPG:3857 as crs.</li>`,
  example: {
    url: "https://discover.data.vic.gov.au/",
    type: "ckan-group",
    name: "DataVic Open Data Portal",
    filterQuery: [
      {
        fq: '+(res_format:(wms OR WMS OR shapefile OR Shapefile OR "zip (shp)" OR shp OR SHP OR kmz OR GeoJSON OR geojson OR csv-geo-au OR aus-geo-csv))'
      }
    ],
    groupBy: "organization",
    supportedResourceFormats: [
      {
        id: "WMS",
        urlRegex: "^((?!data.gov.au/geoserver).)*$"
      },
      {
        id: "Kml",
        onlyUseIfSoleResource: true
      },
      {
        id: "Shapefile",
        onlyUseIfSoleResource: true
      }
    ],
    ungroupedTitle: "Organisation not declared",
    itemPropertiesByType: [
      {
        type: "wms",
        itemProperties: {
          crs: "EPSG:3857"
        }
      }
    ],
    resourceIdTemplate: "{{resource.name}}-{{resource.format}}",
    restrictResourceIdTemplateToOrgsWithNames: [
      "department-of-energy-environment-climate-action",
      "department-of-jobs-skills-industry-regions",
      "department-of-transport-and-planning",
      "victorian-electoral-commission"
    ],
    id: "some id"
  }
})
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
         array causes an independent request to the CKAN, and the results are concatenated.  The
         search string is equivalent to what would be in the parameters segment of the url calling the CKAN search api.
         See the [Solr documentation](http://wiki.apache.org/solr/CommonQueryParameters#fq) for information about filter queries.
         Each item is an object ({ fq: 'res_format:wms' }). For robustness sake, a query string is also allowed. E.g.
         "fq=(res_format:wms OR res_format:WMS)" and "fq=+(res_format%3Awms%20OR%20res_format%3AWMS)" are allowed.
         <li>To get all the datasets with wms resources: [{ fq: 'res_format%3awms' }]</li>
         <li>To get all wms/WMS datasets in the Surface Water group: [{q: 'groups=Surface Water', fq: 'res_format:WMS' }]</li>
         <li>To get both wms and esri-mapService datasets: [{q: 'res_format:WMS'}, {q: 'res_format:"Esri REST"' }]</li>
         <li>To get all datasets with no filter, you can use ['']</li>
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

  @primitiveTrait({
    type: "string",
    name: "Resource ID template string.",
    description:
      "A Mustache formatted template string for generating a custom resource id from resource description. By default we use `resource.id` as the ID of the CKAN item but some CKAN services change their resource IDs frequently which can break terria features link share links or catalog search indexing. You can use `customResourceIdTemplate` to instruct terria to construct a different ID instead of the default `resource.id`. The template string will receive the entire `resource` as a template variable. Example usage: '{{resource.name}}-{{resource.format}}'."
  })
  resourceIdTemplate?: string;

  @primitiveArrayTrait({
    type: "string",
    name: "Restrict resource id template to organization with names",
    description:
      "Names of organisations for which `customResourceIdTemplate` should be used."
  })
  restrictResourceIdTemplateToOrgsWithNames?: string[];
}
