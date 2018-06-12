import ModelTraits from './ModelTraits';
import mixCatalogMemberTraits from './mixCatalogMemberTraits';
import mixGroupTraits from './mixGroupTraits';

export default class CatalogGroupTraits extends mixGroupTraits(mixCatalogMemberTraits(ModelTraits)) {
}
