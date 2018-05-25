import CatalogGroupDefinition from './CatalogGroupDefinition';
import primitiveProperty from './primitiveProperty';

export default class WebMapServiceCatalogGroupDefinition extends CatalogGroupDefinition {
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
        type: 'boolean',
        name: 'Flatten',
        description: 'True to flatten the layers into a single list; false to use the layer hierarchy.'
    })
    flatten: boolean;
}
