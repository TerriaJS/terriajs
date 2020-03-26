import primitiveTrait from "./primitiveTrait";
import anyTrait from "./anyTrait";
import JsonObject from "../Core/Json";
import objectArrayTrait from "./objectArrayTrait";
import CkanResourceFormatTraits from "./CkanResourceFormatTraits";
import mixTraits from "./mixTraits";

export default class CkanSharedTraits extends mixTraits() {

  @anyTrait({
    name: "Item Properties",
    description: "An object of properties that will be set on the item created from the CKAN resource."
  })
  itemProperties?: JsonObject;

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

  @objectArrayTrait({
    name: "Supported Formats",
    description:
      "The supported distribution formats and their mapping to Terria types. " +
      "These are listed in order of preference.",
    type: CkanResourceFormatTraits,
    idProperty: "id"
  })
  supportedFormats?: CkanResourceFormatTraits[];

  // @primitiveTrait({
  //   type: "boolean",
  //   name: "Allow geojson",
  //   description:
  //     "True to allow GeoJSON resources to be added to the catalog; otherwise, false."
  // })
  // allowGeoJson: boolean = true;

  // @primitiveTrait({
  //   type: "string",
  //   name: "Geojson resource format",
  //   description:
  //     "Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a GeoJSON resource"
  // })
  // geoJsonResourceFormat: string = "^geojson$";

  // @primitiveTrait({
  //   type: "boolean",
  //   name: "Include WMS",
  //   description:
  //     "True to allow WMS resources to be added to the catalog; otherwise, false."
  // })
  // allowWms: boolean = true;

  // @primitiveTrait({
  //   type: "string",
  //   name: "WMS resource format",
  //   description:
  //     "Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a WMS resource"
  // })
  // wmsResourceFormat: string = "^wms$";

  // @primitiveTrait({
  //   type: "boolean",
  //   name: "Include WFS",
  //   description:
  //     "True to allow WFS resources to be added to the catalog; otherwise, false."
  // })
  // allowWfs: boolean = true;

  // @primitiveTrait({
  //   type: "string",
  //   name: "WFS resource format",
  //   description:
  //     "Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a WFS resource"
  // })
  // wfsResourceFormat: string = "^wfs$";

  // @primitiveTrait({
  //   type: "boolean",
  //   name: "Include KML",
  //   description:
  //     "True to allow KML resources to be added to the catalog; otherwise, false."
  // })
  // allowKml: boolean = true;

  // @primitiveTrait({
  //   type: "string",
  //   name: "KML resource format",
  //   description:
  //     "Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a KML resource"
  // })
  // kmlResourceFormat: string = "^kml$";

  // @primitiveTrait({
  //   type: "boolean",
  //   name: "Include CSV",
  //   description:
  //     "True to allow CSV resources to be added to the catalog; otherwise, false."
  // })
  // allowCsv: boolean = true;

  // @primitiveTrait({
  //   type: "string",
  //   name: "CSV resource format",
  //   description:
  //     "Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a CSV resource"
  // })
  // csvResourceFormat: string = "^csv-geo-";

  // @primitiveTrait({
  //   type: "boolean",
  //   name: "Include ArcGIS Map Servers",
  //   description:
  //     "True to allow ArcGIS Map Server resources to be added to the catalog; otherwise, false."
  // })
  // allowArcGisMapServer: boolean = true;

  // @primitiveTrait({
  //   type: "string",
  //   name: "ArcGIS MapServer resource format",
  //   description: `
  //       Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a ArcGIS Map Service resource
  //       A valid MapServer resource must also have \`MapServer\` in its URL.`
  // })
  // arcGisMapServerResourceFormat: string = "^esri rest$";

  // @primitiveTrait({
  //   type: "boolean",
  //   name: "Include ArcGIS Feature Servers",
  //   description:
  //     "True to allow ArcGIS Feature Server resources to be added to the catalog; otherwise, false."
  // })
  // allowArcGisFeatureServer: boolean = true;

  // @primitiveTrait({
  //   type: "string",
  //   name: "ArcGIS Feature Server resource format",
  //   description: `
  //       Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a ArcGIS Map Service resource
  //       A valid FeatureServer resource must also have \`FeatureServerServer\` in its URL.`
  // })
  // arcGisFeatureServerResourceFormat: string = "^esri rest$";
}
