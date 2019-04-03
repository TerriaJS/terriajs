import CatalogMemberMixin from '../ModelMixins/CatalogMemberMixin';
import GroupMixin from '../ModelMixins/GroupMixin';
import CatalogGroupTraits from '../Traits/CatalogGroupTraits';
import CreateModel from './CreateModel';

export default class CatalogGroup extends GroupMixin(CatalogMemberMixin(CreateModel(CatalogGroupTraits))) {
    get type() {
        return 'group';
    }

    loadMetadata(): Promise<void> {
        return Promise.resolve(undefined);
    }
}
