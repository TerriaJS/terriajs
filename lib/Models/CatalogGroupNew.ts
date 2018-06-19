import CatalogGroupTraits from '../Traits/CatalogGroupTraits';
import CatalogMemberMixin from '../ModelMixins/CatalogMemberMixin';
import GroupMixin from '../ModelMixins/GroupMixin';
import Model from './Model';
import Terria from './TerriaNew';

export default class CatalogGroup extends GroupMixin(CatalogMemberMixin(Model(CatalogGroupTraits))) {
    get type() {
        return 'group';
    }
}
