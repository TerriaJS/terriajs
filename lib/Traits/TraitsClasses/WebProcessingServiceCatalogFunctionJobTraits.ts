import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import CatalogFunctionJobTraits from "./CatalogFunctionJobTraits";
import WebProcessingServiceCatalogFunctionTraits from "./WebProcessingServiceCatalogFunctionTraits";

export class InputAttributeTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Name",
    description: "Input attribtue name"
  })
  name?: string;

  @primitiveTrait({
    type: "string",
    name: "Value",
    description: "Input attribtue value"
  })
  value?: string;
}

export class WPSParameterTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Input Identifier",
    description: "WPS input parameter identifier"
  })
  inputIdentifier?: string;

  @primitiveTrait({
    type: "string",
    name: "Input Value",
    description: "WPS input parameter value"
  })
  inputValue?: string;

  @primitiveTrait({
    type: "string",
    name: "Input Type",
    description: "WPS input parameter type"
  })
  inputType?: string;

  @objectArrayTrait({
    type: InputAttributeTraits,
    name: "Input Attributes",
    description: "Attributes to set for the input type",
    idProperty: "name"
  })
  inputAttributes?: InputAttributeTraits[];
}

export default class WebProcessingServiceCatalogJobTraits extends mixTraits(
  CatalogFunctionJobTraits,
  WebProcessingServiceCatalogFunctionTraits
) {
  @objectArrayTrait({
    type: WPSParameterTraits,
    idProperty: "index",
    name: "Parameters",
    description: "Parameter names & values for this result item"
  })
  wpsParameters?: WPSParameterTraits[];

  @anyTrait({
    name: "WPS Response",
    description: "The WPS response object"
  })
  wpsResponse?: JsonObject;

  @anyTrait({
    name: "Geojson features",
    description: "Geojson feature collection of input features."
  })
  geojsonFeatures?: JsonObject[];

  @primitiveTrait({
    type: "string",
    name: "WPS response URL",
    description: "WPS response URL"
  })
  wpsResponseUrl?: string;
}
