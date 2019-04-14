import anyTrait from "./anyTrait";
import CatalogMemberTraits from "./CatalogMemberTraits";
import MappableTraits from "./MappableTraits";
import mixTraits from "./mixTraits";
import ModelTraits from "./ModelTraits";
import objectTrait from "./objectTrait";
import primitiveTrait from "./primitiveTrait";
import UrlTraits from "./UrlTraits";
import { JsonObject } from "../Core/Json";

export class StyleTraits extends ModelTraits {
    @primitiveTrait({
        type: "string",
        name: "marker-size",
        description: "Marker size."
    })
    "marker-size"?: string;

    @primitiveTrait({
        type: "string",
        name: "marker-color",
        description: "Marker color"
    })
    "marker-color"?: string;

    @primitiveTrait({
        type: "string",
        name: "marker-symbol",
        description: "Marker symbol."
    })
    "marker-symbol"?: string;

    @primitiveTrait({
        type: "string",
        name: "marker-opacity",
        description: "Marker opacity."
    })
    "marker-opacity"?: string;

    @primitiveTrait({
        type: "string",
        name: "stroke",
        description: "Stroke color."
    })
    "stroke"?: string;

    @primitiveTrait({
        type: "string",
        name: "stroke-width",
        description: "Stroke width."
    })
    "stroke-width"?: string;

    @primitiveTrait({
        type: "string",
        name: "fill",
        description: "Fill color."
    })
    "fill"?: string;

    @primitiveTrait({
        type: "string",
        name: "fill-opacity",
        description: "Fill opacity."
    })
    "fill-opacity"?: string;
}

export default class GeoJsonCatalogItemTraits extends mixTraits(
    UrlTraits,
    MappableTraits,
    CatalogMemberTraits
) {
    @objectTrait({
        type: StyleTraits,
        name: "Style",
        description: "Styling rules that follow simplestyle-spec"
    })
    style?: StyleTraits;

    @anyTrait({
        name: "geoJsonData",
        description: "A geojson data object"
    })
    geoJsonData?: JsonObject;

    @primitiveTrait({
        type: "string",
        name: "geoJsonString",
        description: "A geojson string"
    })
    geoJsonString?: string;
}
