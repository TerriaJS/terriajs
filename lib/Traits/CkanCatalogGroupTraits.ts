import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import ModelTraits from "./ModelTraits";
import mixTraits from "./mixTraits";
import UrlTraits from "./UrlTraits";
import primitiveTrait from "./primitiveTrait";
import anyTrait from "./anyTrait";

export default class CkanCatalogGroupTraits extends mixTraits(
  GroupTraits,
  UrlTraits,
  CatalogMemberTraits
) {
  @anyTrait({
    name: "Blacklist",
    description: `An array of strings of blacklisted groups names and data titles.
      A group or data source that appears in this list will not be shown to the user.`
  })
  blacklist?: string[];

  @primitiveTrait({
    type: "string",
    name: "Filter Query",
    description: `Gets or sets the filter query to pass to CKAN when querying the available data sources and their groups. Each item in the
         * array causes an independent request to the CKAN, and the results are concatenated.  The
         * search string is equivalent to what would be in the parameters segment of the url calling the CKAN search api.
         * See the [Solr documentation](http://wiki.apache.org/solr/CommonQueryParameters#fq) for information about filter queries.
         * Each item can be either a URL-encoded string ("fq=res_format%3awms") or an object ({ fq: 'res_format:wms' }). The latter
         * format is easier to work with.
         *   To get all the datasets with wms resources: [{ fq: 'res_format%3awms' }]
         *   To get all wms/WMS datasets in the Surface Water group: [{q: 'groups=Surface Water', fq: 'res_format:WMS' }]
         *   To get both wms and esri-mapService datasets: [{q: 'res_format:WMS'}, {q: 'res_format:"Esri REST"' }]
         *   To get all datasets with no filter, you can use ['']
         * This property is required.
         * This property is observable.
       `
  })
  filterQuery?: string;

  @primitiveTrait({
    type: "string",
    name: "Group By",
    description: `Gets or sets a value indicating how datasets should be grouped.  Valid values are:
     * none - Datasets are put in a flat list; they are not grouped at all.
     * group - Datasets are grouped according to their CKAN group.  Datasets that are not in any groups are put at the top level.
     * organization - Datasets are grouped by their CKAN organization.  Datasets that are not associated with an organization are put at the top level.
     `
  })
  groupBy?: string = "organization";

  @primitiveTrait({
    type: "string",
    name: "Ungrouped title",
    description: `A title for the group holding all items that don't have a group in CKAN.
      If the value is a blank string or undefined, these items will be left at the top level, not grouped.`
  })
  ungroupedTitle: string = "No group";

  @primitiveTrait({
    type: "boolean",
    name: "Use resource name",
    description: `True to use the name of the resource for the name of the catalog item; false to use the name of the dataset.`
  })
  useResourceName: boolean = false;

  @primitiveTrait({
    type: "boolean",
    name: "Use combination name where multiple resources",
    description: `Use a combination of the name and the resource format and dataset where there are multiple resources for a single dataset.`
  })
  useDatasetNameAndFormatWhereMultipleResources: boolean = true;

  @primitiveTrait({
    type: "boolean",
    name:
      "Use combination of dataset and resource name where multiple resources",
    description: `Use a combination of the name and the resource and dataset name where there are multiple resources for a single dataset.`
  })
  useCombinationNameWhereMultipleResources: boolean = false;

  @primitiveTrait({
    type: "boolean",
    name: "Allow geojson",
    description:
      "True to allow GeoJSON resources to be added to the catalog; otherwise, false."
  })
  allowGeoJson: boolean = true;

  @primitiveTrait({
    type: "string",
    name: "Geojson resource format",
    description:
      "Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a GeoJSON resource"
  })
  geoJsonResourceFormat: string = "^geojson$";

  @primitiveTrait({
    type: "boolean",
    name: "Include WMS",
    description:
      "True to allow WMS resources to be added to the catalog; otherwise, false."
  })
  allowWms: boolean = true;

  @primitiveTrait({
    type: "string",
    name: "WMS resource format",
    description:
      "Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a WMS resource"
  })
  wmsResourceFormat: string = "^wms$";

  @primitiveTrait({
    type: "boolean",
    name: "Include WFS",
    description:
      "True to allow WFS resources to be added to the catalog; otherwise, false."
  })
  allowWfs: boolean = true;

  @primitiveTrait({
    type: "string",
    name: "WFS resource format",
    description:
      "Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a WFS resource"
  })
  wfsResourceFormat: string = "^wfs$";

  @primitiveTrait({
    type: "boolean",
    name: "Include KML",
    description:
      "True to allow KML resources to be added to the catalog; otherwise, false."
  })
  allowKml: boolean = true;

  @primitiveTrait({
    type: "string",
    name: "KML resource format",
    description:
      "Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a KML resource"
  })
  kmlResourceFormat: string = "^kml$";

  @primitiveTrait({
    type: "boolean",
    name: "Include CSV",
    description:
      "True to allow CSV resources to be added to the catalog; otherwise, false."
  })
  allowCsv: boolean = true;

  @primitiveTrait({
    type: "string",
    name: "CSV resource format",
    description:
      "Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a CSV resource"
  })
  csvResourceFormat: string = "^csv";

  @primitiveTrait({
    type: "boolean",
    name: "Include ArcGIS Map Servers",
    description:
      "True to allow ArcGIS Map Server resources to be added to the catalog; otherwise, false."
  })
  allowArcGisMapServer: boolean = true;

  @primitiveTrait({
    type: "string",
    name: "ArcGIS MapServer resource format",
    description: `
        Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a ArcGIS Map Service resource
        A valid MapServer resource must also have \`MapServer\` in its URL.`
  })
  arcgisMapServerResourceFormat: string = "^esri rest$";

  @primitiveTrait({
    type: "boolean",
    name: "Include ArcGIS Feature Servers",
    description:
      "True to allow ArcGIS Feature Server resources to be added to the catalog; otherwise, false."
  })
  allowArcGisFeatureServer: boolean = true;

  @primitiveTrait({
    type: "string",
    name: "ArcGIS Feature Server resource format",
    description: `
        Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a ArcGIS Map Service resource
        A valid FeatureServer resource must also have \`FeatureServerServer\` in its URL.`
  })
  arcgisFeatureServerResourceFormat: string = "^esri rest$";
}
