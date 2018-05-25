import { computed, decorate, extendObservable, isObservableProp } from 'mobx';
import ModelDefinition from '../Definitions/ModelDefinition';
import Terria from './TerriaNew';
import { ModelProperty } from './ModelProperties';

abstract class Model {
    abstract get type(): string;

    constructor(readonly terria: Terria) {
    }

    static definition<T extends ModelDefinition>(definition: { prototype: T, metadata: ModelProperty[] }): Function {
        return function <T extends {new(...args:any[]):{}}>(target: T) {
            const updated: any = class extends target {
                readonly flattened: any;

                constructor(...args: any[]) {
                    super(...args);

                    if (isObservableProp(this, 'flattened')) {
                        this.flattened = createFlattenedLayer(this, definition);
                    } else {
                        extendObservable(this, {
                            flattened: createFlattenedLayer(this, definition)
                        });
                    }
                }
            };

            const decorators = {};

            // Add top-level accessors that don't already exist.
            const metadata = definition.metadata;
            Object.keys(metadata).forEach(propertyName => {
                const property = metadata[propertyName];

                if (!(propertyName in updated.prototype)) {
                    Object.defineProperty(updated.prototype, propertyName, {
                        get: function() {
                            return this.flattened[propertyName];
                        },
                        // set: function(value) {
                        //     this.flattened[propertyName] = value;
                        // },
                        enumerable: true,
                        configurable: true
                    });

                    decorators[propertyName] = computed;
                }
            });

            decorate(updated, decorators);

            return updated;
        }
    }
}

function createFlattenedLayer(model, definition) {
    const metadata = definition.metadata;

    const flattened = {};

    Object.keys(metadata).forEach(propertyName => {
        const property = metadata[propertyName];

        Object.defineProperty(flattened, propertyName, {
            get: function() {
                return property.getValue(model);
            },
            // set: function(value) {
            //     return property.setValue(model, value);
            // },
            enumerable: true
        });
    });

    return flattened;
}

namespace Model {
    export type InterfaceFromDefinition<TDefinition extends ModelDefinition> = {
        readonly [P in keyof TDefinition]: TDefinition[P] extends Array<infer TElement> ? ReadonlyArray<TElement> : TDefinition[P];
    };
}

export default Model;
