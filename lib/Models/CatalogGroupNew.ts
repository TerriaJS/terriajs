import CatalogMemberMixin from '../ModelMixins/CatalogMemberMixin';
import GroupMixin from '../ModelMixins/GroupMixin';
import CatalogGroupTraits from '../Traits/CatalogGroupTraits';
import Model from './Model';

export default class CatalogGroup extends GroupMixin(CatalogMemberMixin(Model(CatalogGroupTraits))) {
    get type() {
        return 'group';
    }
}
