import { primitiveProperty, modelArrayProperty, ModelProperty } from './ModelProperties';
import CatalogMember, { CatalogMemberDefinition } from './CatalogMemberNew';
import { computed, extendObservable, observable, IObservableArray } from 'mobx';

const json = {
    name: 'Test Group',
    type: 'group',
    items: [
        {
            name: 'Test WMS',
            type: 'wms',
            url: 'https://programs.communications.gov.au/geoserver/ows',
            layers: 'mybroadband:MyBroadband_ADSL_Availability'
        }
    ]
}

function createCatalogMemberFromType(type: string): CatalogMember {
    return undefined;
}

export class CatalogGroupDefinition extends CatalogMemberDefinition {
    @modelArrayProperty({
        name: 'Members',
        description: 'The members of this group.',
        factory: createCatalogMemberFromType,
        typeProperty: 'type',
        idProperty: 'name' // TODO: should be 'id' or something
    })
    members: CatalogMemberDefinition[];
}

export default interface CatalogGroup extends CatalogGroupDefinition {}
export default class CatalogGroup extends CatalogMember {
    private _members = new Map<string, CatalogMember>();

    @computed get members(): CatalogMember[] {
        return undefined;
    }
}
