import CatalogMemberMixin from '../ModelMixins/CatalogMemberMixin';
import GroupMixin from '../ModelMixins/GroupMixin';
import CatalogGroupTraits from '../Traits/CatalogGroupTraits';
import CreateModel from './CreateModel';
import { BaseModel } from './Model';
import ModelReference from '../Traits/ModelReference';

export default class CatalogGroup extends GroupMixin(CatalogMemberMixin(CreateModel(CatalogGroupTraits))) {
    get type() {
        return 'group';
    }

    get loadMetadataPromise(): Promise<void> {
        return Promise.resolve(undefined);
    }

    protected get loadMembersPromise(): Promise<void> {
        return Promise.resolve();
    }
}
