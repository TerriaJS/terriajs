import * as defined from 'terriajs-cesium/Source/Core/defined';

type PrimitiveType = 'string' | 'number' | 'boolean';

export interface ModelPropertyOptions {
    name: string,
    description: string,
}

export interface PrimitivePropertyOptions<T> extends ModelPropertyOptions {
    type: PrimitiveType;
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

export abstract class ModelProperty {
    readonly id: string;
    readonly name: string;
    readonly description: string;

    constructor(id: string, options: ModelPropertyOptions) {
        this.id = id;
        this.name = options.name;
        this.description = options.description;
    }

    abstract getValue(model: any): any;
    abstract setValue(model: any, newValue: any): void;
}

export class PrimitiveProperty<T> extends ModelProperty {
    readonly type: PrimitiveType;
    readonly default: T;

    constructor(id: string, options: PrimitivePropertyOptions<T>) {
        super(id, options);
        this.type = options.type;
        this.default = options.default;
    }

    getValue(model: any): T {
        const layerNames = model.modelStrata;

        // Starting with the topmost layer, find the first layer with a value that is not undefined.
        for (let i = layerNames.length - 1; i >= 0; --i) {
            const layerName = layerNames[i];
            const layer = model[layerName];
            const value = layer[this.id];
            if (value !== undefined) {
                return value;
            }
        }

        return this.default;
    }

    setValue(model: any, newValue: T) {
        model[model.defaultStratumToModify][this.id] = newValue;
    }
}
