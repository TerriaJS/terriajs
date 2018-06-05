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
    if (!mixin || !mixin.traits) {
        throw new DeveloperError('mixin must be defined.');
    }

    if (!definition.traits) {
        definition.traits = {};
    }

    Object.keys(mixin.traits).forEach(propertyKey => {
        if (!definition.traits.hasOwnProperty(propertyKey)) {
            definition.traits[propertyKey] = mixin.traits[propertyKey];
        }
    });
}
