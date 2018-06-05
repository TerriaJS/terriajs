import ModelReference from './ModelReference';
import ModelTraits from './ModelTraits';
import modelReferenceArrayTrait from './modelReferenceArrayTrait';
import primitiveTrait from './primitiveTrait';

export default function mixGroupTraits<TBase extends ModelTraits.Constructor>(Base: TBase) {
    class GroupTraits extends Base {
        @primitiveTrait({
            name: 'Is Open',
            description: 'True if this group is open and its contents are visible; otherwise, false.',
            type: 'boolean'
        })
        isOpen: boolean;

        @modelReferenceArrayTrait({
            name: 'Members',
            description: 'The members of this group.'
        })
        members: ModelReference[];
    }

    return GroupTraits;
}
