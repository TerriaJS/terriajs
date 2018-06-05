import mixCatalogMemberDefinition from './mixCatalogMemberDefinition';
import primitiveTrait from './primitiveTrait';
import ModelDefinition from './ModelDefinition';
import mixUrlDefinition from './mixUrlDefinition';
import mixGetCapabilitiesDefinition from './mixGetCapabilitiesDefinition';

export default class WebMapServiceCatalogItemDefinition extends mixGetCapabilitiesDefinition(mixUrlDefinition(mixCatalogMemberDefinition(ModelDefinition))) {
    @primitiveTrait({
        type: 'string',
        name: 'Is GeoServer',
        description: 'True if this WMS is a GeoServer; otherwise, false.',
        default: false
    })
    isGeoServer: boolean;

    @primitiveTrait({
        type: 'string',
        name: 'Intervals',
        description: 'Intervals'
    })
    intervals: any; // TODO

    @primitiveTrait({
        type: 'string',
        name: 'Layer(s)',
        description: 'The layer or layers to display.'
    })
    layers: string;

    @primitiveTrait({
        type: 'string',
        name: 'Available Styles',
        description: 'The available styles.' // TODO
    })
    availableStyles: any; // TODO
}
