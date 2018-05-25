import { modelReferenceArrayProperty, ModelProperty } from './ModelProperties';
import CatalogMember from './CatalogMemberNew';
import { computed, extendObservable, observable, IObservableArray } from 'mobx';
import defineStratum from './defineStratum';
import ModelReference from '../Definitions/ModelReference';
import CatalogGroupDefinition from '../Definitions/CatalogGroupDefinition';
import Model from './Model';

const FullStratum = defineStratum(CatalogGroupDefinition);

export default interface CatalogGroup extends Model.InterfaceFromDefinition<CatalogGroupDefinition> {}

@Model.definition(CatalogGroupDefinition)
export default class CatalogGroup extends CatalogMember {
    get type() {
        return 'group';
    }

    readonly flattened: Model.InterfaceFromDefinition<CatalogGroupDefinition>;

    @observable modelStrata = ['definitionStratum', 'userStratum'];

    @observable definitionStratum = new FullStratum();
    @observable userStratum = new FullStratum();

    @computed get memberModels(): ReadonlyArray<CatalogMember> {
        return this.flattened.members.map(id => this.terria.getModelById(CatalogMember, id));
    }
}

// export class WebMapServiceCatalogGroup extends CatalogGroup {
//     @observable modelStrata = ['getCapabilitiesStratum', 'definitionStratum', 'userStratum'];

//     readonly getCapabilitiesStratum  = new GetCapabilitiesStratum(layer => this._loadGetCapabilitiesStratum(layer));
// }
