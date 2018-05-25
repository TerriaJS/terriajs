import { computed } from 'mobx';
import * as URI from 'urijs';
import instanceOf from '../Core/instanceOf';
import CatalogMemberDefinition from '../Definitions/CatalogMemberDefinition';
import ModelReference from '../Definitions/ModelReference';
import Model from './Model';

export default interface CatalogMember extends Model.InterfaceFromDefinition<CatalogMemberDefinition> {}
export default abstract class CatalogMember extends Model {
    readonly flattened: Model.InterfaceFromDefinition<CatalogMemberDefinition>;

    @computed
    get nameInCatalog() {
        return this.flattened.nameInCatalog || this.name;
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
