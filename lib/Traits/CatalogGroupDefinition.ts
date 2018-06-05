import mixGroupDefinition from './mixGroupDefinition';
import ModelDefinition from './ModelDefinition';
import mixCatalogMemberDefinition from './mixCatalogMemberDefinition';

export default class CatalogGroupDefinition extends mixGroupDefinition(mixCatalogMemberDefinition(ModelDefinition)) {
}
