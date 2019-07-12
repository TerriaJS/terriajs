import { JsonObject } from "../Core/Json";
import anyTrait from "./anyTrait";
import CatalogMemberTraits from "./CatalogMemberTraits";
import FeatureInfoTraits from "./FeatureInfoTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "./mixTraits";
import ModelTraits from "./ModelTraits";
import objectArrayTrait from "./objectArrayTrait";
import primitiveTrait from "./primitiveTrait";

export class ParameterTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Name",
    description: "Name of the parameter"
  })
  name?: string;

  @primitiveTrait({
    type: "string",
    name: "Value",
    description: "Value of the parameter in human readable format"
  })
  value?: string;

  @anyTrait({
    name: "GeoJsonFeature",
    description: "GeoJson representation of the parameter"
  })
  geoJsonFeature?: JsonObject;
}

export default class WebProcessingServiceCatalogItemTraits extends mixTraits(
  FeatureInfoTraits,
  MappableTraits,
  CatalogMemberTraits
) {
  @anyTrait({
    name: "WPS Response",
    description: "The WPS response object"
  })
  wpsResponse?: JsonObject;

  @objectArrayTrait({
    type: ParameterTraits,
    idProperty: "name",
    name: "Parameters",
    description: "Parameter names & values for this result item"
  })
  parameters?: ParameterTraits[];
}
