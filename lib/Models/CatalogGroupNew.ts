import CatalogGroupTraits from '../Traits/CatalogGroupTraits';
import CatalogMemberMixin from '../ModelMixins/CatalogMemberMixin';
import GroupMixin from '../ModelMixins/GroupMixin';
import Model from './Model';
import Terria from './TerriaNew';

// interface ModelWithDefinition extends Model.InterfaceFromDefinition<CatalogGroupTraits> { }
// class ModelWithDefinition extends Model<CatalogGroupTraits> { }

const C = Model(CatalogGroupTraits);
const x = new C('test', new Terria());
console.log(x);

// @Model.definition(CatalogGroupTraits)
export default class CatalogGroup extends GroupMixin(CatalogMemberMixin(Model(CatalogGroupTraits))) {
    get type() {
        return 'group';
    }
}
