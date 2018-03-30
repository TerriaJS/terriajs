import { computed, decorate, extendObservable, observable } from 'mobx';
import * as DeveloperError from 'terriajs-cesium/Source/Core/DeveloperError';
import * as defined from 'terriajs-cesium/Source/Core/defined';

export function definition(options) {
    return function(target: any) {
        if (options.mixins) {
            options.mixins.forEach(mixin => {
                mixDefinition(target, mixin);
            });
        }
    }
}

export function model(definition) {
    return function <T extends {new(...args:any[]):{}}>(target: T) {
        const updated = class extends target {
            constructor(...args: any[]) {
                super(...args);

                extendObservable(this, {
                    flattened: createFlattenedLayer(this, definition)
                });
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
                    set: function(value) {
                        this.flattened[propertyName] = value;
                    },
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

function createFlattenedLayer(model, definition) {
    const metadata = definition.metadata;

    const flattened = {};

    Object.keys(metadata).forEach(propertyName => {
        const property = metadata[propertyName];

        Object.defineProperty(flattened, propertyName, {
            get: function() {
                return property.getValue(model);
            },
            set: function(value) {
                return property.setValue(model, value);
            },
            enumerable: true
        });
    });

    return flattened;
}

function mixDefinition(definition, mixin) {
    if (!definition) {
        throw new DeveloperError('definition must be defined.');
    }
    if (!mixin || !mixin.metadata) {
        throw new DeveloperError('mixin must be defined.');
    }

    if (!definition.metadata) {
        definition.metadata = {};
    }

    Object.keys(mixin.metadata).forEach(propertyKey => {
        if (!definition.metadata.hasOwnProperty(propertyKey)) {
            definition.metadata[propertyKey] = mixin.metadata[propertyKey];
        }
    });
}
