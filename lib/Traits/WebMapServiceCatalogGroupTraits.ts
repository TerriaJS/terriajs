import mixGroupTraits from './mixGroupTraits';
import mixCatalogMemberTraits from './mixCatalogMemberTraits';
import ModelTraits from './ModelTraits';
import mixUrlTraits from './mixUrlTraits';
import primitiveTrait from './primitiveTrait';
import mixGetCapabilitiesTraits from './mixGetCapabilitiesTraits';

export default class WebMapServiceCatalogGroupTraits extends mixGetCapabilitiesTraits(mixGroupTraits(mixUrlTraits(mixCatalogMemberTraits(ModelTraits)))) {
    @primitiveTrait({
        type: 'boolean',
        name: 'Flatten',
        description: 'True to flatten the layers into a single list; false to use the layer hierarchy.'
    })
    flatten: boolean;
}
