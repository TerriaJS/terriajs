import CatalogMemberDefinition from './CatalogMemberDefinition';
import { modelReferenceArrayProperty } from '../Models/ModelProperties';
import ModelReference from './ModelReference';

export default class CatalogGroupDefinition extends CatalogMemberDefinition {
    @modelReferenceArrayProperty<CatalogMemberDefinition>({
        name: 'Members',
        description: 'The members of this group.',
        idProperty: 'id'
    })
    members: ModelReference[];
}
