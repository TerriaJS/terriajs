import mixCatalogMemberDefinition from './mixCatalogMemberDefinition';
import primitiveProperty from './primitiveProperty';
import ModelDefinition from './ModelDefinition';
import mixUrlDefinition from './mixUrlDefinition';
import mixGetCapabilitiesDefinition from './mixGetCapabilitiesDefinition';

export default class WebMapServiceCatalogItemDefinition extends mixGetCapabilitiesDefinition(mixUrlDefinition(mixCatalogMemberDefinition(ModelDefinition))) {
    @primitiveProperty({
        type: 'string',
        name: 'Is GeoServer',
        description: 'True if this WMS is a GeoServer; otherwise, false.',
        default: false
    })
    isGeoServer: boolean;

    @primitiveProperty({
        type: 'string',
        name: 'Intervals',
        description: 'Intervals'
    })
    intervals: any; // TODO

    @primitiveProperty({
        type: 'string',
        name: 'Layer(s)',
        description: 'The layer or layers to display.'
    })
    layers: string;

    @primitiveProperty({
        type: 'string',
        name: 'Available Styles',
        description: 'The available styles.' // TODO
    })
    availableStyles: any; // TODO
}
