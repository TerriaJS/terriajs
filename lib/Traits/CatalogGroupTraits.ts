import mixGroupTraits from './mixGroupTraits';
import ModelTraits from './ModelTraits';
import mixCatalogMemberTraits from './mixCatalogMemberTraits';

export default class CatalogGroupTraits extends mixGroupTraits(mixCatalogMemberTraits(ModelTraits)) {
}
