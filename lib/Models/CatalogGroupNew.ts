import CatalogGroupTraits from '../Traits/CatalogGroupTraits';
import CatalogMemberMixin from '../ModelMixins/CatalogMemberMixin';
import GroupMixin from '../ModelMixins/GroupMixin';
import Model from './Model';
import Terria from './TerriaNew';

interface ModelWithDefinition extends Model.InterfaceFromDefinition<CatalogGroupTraits> { }
class ModelWithDefinition extends Model<CatalogGroupTraits> { }

@Model.definition(CatalogGroupTraits)
export default class CatalogGroup extends GroupMixin(CatalogMemberMixin(ModelWithDefinition)) {
    get type() {
        return 'group';
    }
}
