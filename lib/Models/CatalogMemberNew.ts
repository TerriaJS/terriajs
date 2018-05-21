import { primitiveProperty, modelArrayProperty, ModelProperty } from './ModelProperties';
import { model, definition } from './Decorators';
import { computed, extendObservable, observable, IObservableArray } from 'mobx';
import * as defaultValue from 'terriajs-cesium/Source/Core/defaultValue';
import * as URI from 'urijs';

export interface InfoSection {
    name: string;
    content: string;
}

export class CatalogMemberDefinition {
    static metadata: ModelProperty[];

    type?: string;

    @primitiveProperty({
        type: 'string',
        name: 'Name',
        description: 'The name of the catalog item.',
        default: 'Unnamed'
    })
    name: string;

    @primitiveProperty({
        type: 'string',
        name: 'Description',
        description: 'The description of the catalog item. Markdown and HTML may be used.'
    })
    description: string;

    @primitiveProperty({
        type: 'string',
        name: 'Name in catalog',
        description: 'The name of the item to be displayed in the catalog, if it is different from the one to display on the workbench.'
    })
    nameInCatalog: string;

    @primitiveProperty({
        type: 'string',
        name: 'URL',
        description: 'The base URL of the WMS server.'
    })
    url: string;

    @modelArrayProperty({
        name: 'Info',
        description: 'Human-readable information about this dataset.',
        type: InfoSection,
        key: 'name'
    })
    info: InfoSection[];
}

export default interface CatalogMember extends CatalogMemberDefinition {}
export default abstract class CatalogMember {
    readonly flattened: CatalogMemberDefinition;

    @computed
    get nameInCatalog() {
        return this.flattened.nameInCatalog || this.name;
    }
    set nameInCatalog(value) {
        this.flattened.nameInCatalog = value;
    }

    @computed
    get nameSortKey() {
        var parts = this.nameInCatalog.split(/(\d+)/);
        return parts.map(function(part) {
            var parsed = parseInt(part, 10);
            if (parsed === parsed) {
                return parsed;
            } else {
                return part.trim().toLowerCase();
            }
        });
    }

    @computed
    get uri(): URI {
        if (this.url === undefined) {
            return undefined;
        }
        return new URI(this.url);
    }
}
