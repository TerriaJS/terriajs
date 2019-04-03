import CatalogMemberTraits from './CatalogMemberTraits';
import GetCapabilitiesTraits from './GetCapabilitiesTraits';
import mixTraits from './mixTraits';
import ModelTraits from './ModelTraits';
import objectArrayTrait from './objectArrayTrait';
import objectTrait from './objectTrait';
import primitiveTrait from './primitiveTrait';
import RasterLayerTraits from './RasterLayerTraits';
import UrlTraits from './UrlTraits';

export class LegendTraits extends ModelTraits {
    @primitiveTrait({
        type: 'string',
        name: 'URL',
        description: 'The URL of the legend image.'
    })
    url?: string;

    @primitiveTrait({
        type: 'string',
        name: 'MIME Type',
        description: 'The MIME type of the legend image.'
    })
    mimeType?: string;
}

export class WebMapServiceAvailableStyleTraits extends ModelTraits {
    @primitiveTrait({
        type: 'string',
        name: 'Style Name',
        description: 'The name of the style.'
    })
    name?: string;

    @primitiveTrait({
        type: 'string',
        name: 'Title',
        description: 'The title of the style.'
    })
    title?: string;

    @primitiveTrait({
        type: 'string',
        name: 'Abstract',
        description: 'The abstract describing the style.'
    })
    abstract?: string;

    @objectTrait({
        type: LegendTraits,
        name: 'Style Name',
        description: 'The name of the style.'
    })
    legendUrl?: LegendTraits;
}

export class WebMapServiceAvailableLayerStylesTraits extends ModelTraits {
    @primitiveTrait({
        type: 'string',
        name: 'Layer Name',
        description: 'The name of the layer for which styles are available.'
    })
    layerName?: string;

    @objectArrayTrait({
        type: WebMapServiceAvailableStyleTraits,
        name: 'Styles',
        description: 'The styles available for this layer.',
        idProperty: 'name'
    })
    styles?: WebMapServiceAvailableStyleTraits[];
}

export default class WebMapServiceCatalogItemTraits extends mixTraits(
    GetCapabilitiesTraits,
    RasterLayerTraits,
    UrlTraits,
    CatalogMemberTraits
) {
    @primitiveTrait({
        type: 'string',
        name: 'Is GeoServer',
        description: 'True if this WMS is a GeoServer; otherwise, false.'
    })
    isGeoServer: boolean = false;

    @primitiveTrait({
        type: 'string',
        name: 'Intervals',
        description: 'Intervals'
    })
    intervals?: any; // TODO

    @primitiveTrait({
        type: 'string',
        name: 'Layer(s)',
        description: 'The layer or layers to display.'
    })
    layers?: string;

    @objectArrayTrait({
        type: WebMapServiceAvailableLayerStylesTraits,
        name: 'Available Styles',
        description: 'The available styles.',
        idProperty: 'layerName'
    })
    availableStyles?: WebMapServiceAvailableLayerStylesTraits[];
}
