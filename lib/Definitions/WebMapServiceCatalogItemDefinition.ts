import CatalogMemberDefinition from './CatalogMemberDefinition';
import primitiveProperty from './primitiveProperty';

export default class WebMapServiceCatalogItemDefinition extends CatalogMemberDefinition {
    @primitiveProperty({
        type: 'string',
        name: 'Is GeoServer',
        description: 'True if this WMS is a GeoServer; otherwise, false.',
        default: false
    })
    isGeoServer: boolean;

    @primitiveProperty({
        type: 'string',
        name: 'GetCapabilities URL',
        description: 'The URL at which to access to the WMS GetCapabilities.'
    })
    getCapabilitiesUrl: string;

    @primitiveProperty({
        type: 'string',
        name: 'GetCapabilities Cache Duration',
        description: 'The amount of time to cache GetCapabilities responses.',
        default: '1d'
    })
    getCapabilitiesCacheDuration: string;

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
