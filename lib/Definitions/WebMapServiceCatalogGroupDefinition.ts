import mixGroupDefinition from './mixGroupDefinition';
import mixCatalogMemberDefinition from './mixCatalogMemberDefinition';
import ModelDefinition from './ModelDefinition';
import mixUrlDefinition from './mixUrlDefinition';
import primitiveProperty from './primitiveProperty';
import mixGetCapabilitiesDefinition from './mixGetCapabilitiesDefinition';

export default class WebMapServiceCatalogGroupDefinition extends mixGetCapabilitiesDefinition(mixGroupDefinition(mixUrlDefinition(mixCatalogMemberDefinition(ModelDefinition)))) {
    @primitiveProperty({
        type: 'boolean',
        name: 'Flatten',
        description: 'True to flatten the layers into a single list; false to use the layer hierarchy.'
    })
    flatten: boolean;
}
