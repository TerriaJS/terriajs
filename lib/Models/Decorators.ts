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
