import anyTrait from "./anyTrait";
import mixCatalogMemberTraits from "./mixCatalogMemberTraits";
import ModelTraits from "./ModelTraits";
import mixUrlTraits from "./mixUrlTraits";
import mixGetCapabilitiesTraits from "./mixGetCapabilitiesTraits";
import objectTrait from "./objectTrait";
import primitiveTrait from "./primitiveTrait";
import objectArrayTrait from "./objectArrayTrait";

export class StyleTraits extends ModelTraits {
    @primitiveTrait({
        type: 'string',
        name: 'marker-size',
        description: 'Marker size.',
    })
    'marker-size'?: string;

    @primitiveTrait({
        type: 'string',
        name: 'marker-color',
        description: 'Marker color'
    })
    'marker-color'?: string;

    @primitiveTrait({
        type: 'string',
        name: 'marker-symbol',
        description: 'Marker symbol.'
    })
    'marker-symbol'?: string;

    @primitiveTrait({
        type: 'string',
        name: 'marker-opacity',
        description: 'Marker opacity.'
    })
    'marker-opacity'?: string;
    
   @primitiveTrait({
        type: 'string',
        name: 'stroke',
        description: 'Stroke color.'
    })
    'stroke'?: string;
    
   @primitiveTrait({
        type: 'string',
        name: 'stroke-width',
        description: 'Stroke width.'
    })
    'stroke-width'?: string;

   @primitiveTrait({
        type: 'string',
        name: 'fill',
        description: 'Fill color.'
    })
    'fill'?: string;

   @primitiveTrait({
        type: 'string',
        name: 'fill-opacity',
        description: 'Fill opacity.'
    })
    'fill-opacity'?: string;
}

export default class GeoJsonCatalogItemTraits extends mixGetCapabilitiesTraits(
    mixUrlTraits(mixCatalogMemberTraits(ModelTraits))
) {
    @objectTrait({
        type: StyleTraits,
        name: 'Style',
        description: 'Styling rules that follow simplestyle-spec',
    })
    style?: StyleTraits

    @anyTrait({
        name: 'geoJsonData',
        description: 'A geojson data object'
    })
    geoJsonData?: any

    @primitiveTrait({
        type: 'string',
        name: 'geoJsonString',
        description: 'A geojson string'
    })
    geoJsonString?: string
}
