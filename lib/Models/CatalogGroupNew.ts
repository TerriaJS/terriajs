import CatalogGroupDefinition from '../Traits/CatalogGroupDefinition';
import CatalogMemberMixin from '../ModelMixins/CatalogMemberMixin';
import GroupMixin from '../ModelMixins/GroupMixin';
import Model from './Model';

interface ModelWithDefinition extends Model.InterfaceFromDefinition<CatalogGroupDefinition> { }
class ModelWithDefinition extends Model<CatalogGroupDefinition> { }

@Model.definition(CatalogGroupDefinition)
export default class CatalogGroup extends GroupMixin(CatalogMemberMixin(ModelWithDefinition))
{
    get type() {
        return 'group';
    }
}
