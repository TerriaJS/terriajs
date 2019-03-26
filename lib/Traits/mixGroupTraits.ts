import ModelReference from './ModelReference';
import ModelTraits from './ModelTraits';
import modelReferenceArrayTrait from './modelReferenceArrayTrait';
import primitiveTrait from './primitiveTrait';
import CatalogMemberFactory from '../Models/CatalogMemberFactory';
import TraitsConstructor from './TraitsConstructor';

export default function mixGroupTraits<TBase extends TraitsConstructor<ModelTraits>>(Base: TBase) {
    class GroupTraits extends Base {
        @primitiveTrait({
            name: 'Is Open',
            description: 'True if this group is open and its contents are visible; otherwise, false.',
            type: 'boolean'
        })
        isOpen?: boolean;

        @modelReferenceArrayTrait({
            name: 'Members',
            description: 'The members of this group.',
            factory: CatalogMemberFactory
        })
        members?: ModelReference[];
    }

    return GroupTraits;
}
