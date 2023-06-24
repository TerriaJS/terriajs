import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import CatalogMemberTraits from "./CatalogMemberTraits";
import GetCapabilitiesTraits from "./GetCapabilitiesTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import UrlTraits from "./UrlTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";

export type QueryPropertyName =
  | "identifier"
  | "title"
  | "type"
  | "abstract"
  | "format"
  | "modified"
  | "relation"
  | "spatial"
  | "subject";

export class DomainSpecTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Domain Property Name",
    description: "Domain Property Name."
  })
  domainPropertyName?: string;
  @primitiveTrait({
    type: "string",
    name: "Hierarchy Separator",
    description: "Hierarchy Separator."
  })
  hierarchySeparator?: string;
  @primitiveTrait({
    type: "string",
    name: "Query Property Name",
    description: "Query Property Name."
  })
  queryPropertyName?: QueryPropertyName;
}

export default class CswCatalogGroupTraits extends mixTraits(
  GetCapabilitiesTraits,
  GroupTraits,
  UrlTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
) {
  @primitiveTrait({
    type: "boolean",
    name: "Flatten",
    description:
      "True to flatten the layers into a single list; false to use the layer hierarchy."
  })
  flatten?: boolean = false;

  @objectTrait({
    type: DomainSpecTraits,
    name: "Domain Specification",
    description: "Domain Specification"
  })
  domainSpecification?: DomainSpecTraits;

  @primitiveTrait({
    type: "boolean",
    name: "Include WMS",
    description:
      "True to allow WMS resources to be added to the catalog; otherwise, false."
  })
  includeWms: boolean = true;

  @primitiveTrait({
    type: "boolean",
    name: "Include KML",
    description:
      "True to allow KML resources to be added to the catalog; otherwise, false."
  })
  includeKml: boolean = true;

  @primitiveTrait({
    type: "boolean",
    name: "Include CSV",
    description:
      "True to allow CSV resources to be added to the catalog; otherwise, false."
  })
  includeCsv: boolean = true;

  @primitiveTrait({
    type: "boolean",
    name: "Include ESRI Map Server",
    description:
      "True to allow ESRI Map resources to be added to the catalog; otherwise, false."
  })
  includeEsriMapServer: boolean = true;

  @primitiveTrait({
    type: "boolean",
    name: "Include GeoJSON",
    description:
      "True to allow GeoJSON resources to be added to the catalog; otherwise, false"
  })
  includeGeoJson: boolean = true;

  @primitiveTrait({
    type: "string",
    name: "WMS Resource Format",
    description:
      "Gets or sets a regular expression that, when it matches the protocol attribute of a URI element of a record, indicates that the URI is a WMS resource."
  })
  wmsResourceFormat = "\\bwms\\b";

  @primitiveTrait({
    type: "string",
    name: "KML Resource Format",
    description:
      "Gets or sets a regular expression that, when it matches the protocol attribute of a URI element of a record, indicates that the resource is a KML resource."
  })
  kmlResourceFormat = "\\bkml\\b";

  @primitiveTrait({
    type: "string",
    name: "CSV Resource Format",
    description:
      "Gets or sets a regular expression that, when it matches the protocol attribute of a URI element of a record, indicates that the URI is a CSV resource."
  })
  csvResourceFormat = "\\bcsv-geo-";

  @primitiveTrait({
    type: "string",
    name: "ESRI MapServer Resource Format",
    description:
      "Gets or sets a regular expression that, when it matches the protocol attribute of a URI element of a record, indicates that the URI is a Esri MapServer resource."
  })
  esriMapServerResourceFormat = "\\besri rest\\b";

  @primitiveTrait({
    type: "string",
    name: "WMS Resource Format",
    description:
      "Gets or sets a regular expression that, when it matches the protocol attribute of a URI element of a record, indicates that the URI is a GeoJSON resource."
  })
  geoJsonResourceFormat = "\\bgeojson\\b";

  @primitiveTrait({
    type: "string",
    name: "GetRecords Template",
    description:
      "Gets or sets the template XML string to POST to the CSW server to query for catalog items.  If this property is undefined,`lib/Models/CswGetRecordsTemplate.xml` is used.  The XML string should have a `{startPosition}` placeholder to be replaced with the next start position in order to allow incremental paging of results.."
  })
  getRecordsTemplate?: string;
}
