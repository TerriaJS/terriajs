import * as defined from 'terriajs-cesium/Source/Core/defined';

type PrimitiveType = 'string' | 'number' | 'boolean';

export interface PrimitivePropertyOptions<T> {
    type: PrimitiveType;
    name: string,
    description: string,
    default?: T;
}

export function primitiveProperty<T>(options: PrimitivePropertyOptions<T>) {
    return function(target: any, propertyKey: string) {
        const constructor = target.constructor;
        if (!constructor.metadata) {
            constructor.metadata = {};
        }
        constructor.metadata[propertyKey] = new PrimitiveProperty(propertyKey, options);
    }
}

export class PrimitiveProperty<T> {
    readonly id: string;
    readonly type: PrimitiveType;
    readonly name: string;
    readonly description: string;
    readonly default: T;

    constructor(id: string, options: PrimitivePropertyOptions<T>) {
        this.id = id;
        this.type = options.type;
        this.name = options.name;
        this.description = options.description;
        this.default = options.default;
    }

    getValue(model: any): T {
        const layerNames = model.modelLayers;

        // Starting with the topmost layer, find the first layer with a value that is not undefined.
        for (let i = layerNames.length - 1; i >= 0; --i) {
            const layerName = layerNames[i];
            const layer = model[layerName];
            const value = layer[this.id];
            if (value !== undefined) {
                return value;
            }
        }

        return undefined;
    }

    setValue(model: any, newValue: T) {
        model[model.defaultLayerToModify][this.id] = newValue;
    }
}
