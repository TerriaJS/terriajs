import { computed } from 'mobx';
import Constructor from '../Core/Constructor';

interface RequiredDefinition {
    nameInCatalog: string;
}

interface RequiredInstance {
    flattened: RequiredDefinition;
    name: string;
}

export default function CatalogMemberMixin<T extends Constructor<RequiredInstance>>(Base: T) {
    abstract class CatalogMemberMixin extends Base {
        abstract get type();

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
    }

    return CatalogMemberMixin;
}
