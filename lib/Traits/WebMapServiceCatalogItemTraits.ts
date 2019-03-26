import mixCatalogMemberTraits from './mixCatalogMemberTraits';
import primitiveTrait from './primitiveTrait';
import ModelTraits from './ModelTraits';
import mixUrlTraits from './mixUrlTraits';
import mixGetCapabilitiesTraits from './mixGetCapabilitiesTraits';
import mixRasterLayerTraits from './mixRasterLayerTraits';

export default class WebMapServiceCatalogItemTraits extends mixGetCapabilitiesTraits(mixRasterLayerTraits(mixUrlTraits(mixCatalogMemberTraits(ModelTraits)))) {
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

    @primitiveTrait({
        type: 'string',
        name: 'Available Styles',
        description: 'The available styles.' // TODO
    })
    availableStyles?: any; // TODO
}
