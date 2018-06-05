import DefinitionProperty, { DefinitionPropertyOptions } from './DefinitionProperty';
import { BaseModel } from '../Models/Model';

type PrimitiveType = 'string' | 'number' | 'boolean';

export interface PrimitivePropertyOptions<T> extends DefinitionPropertyOptions {
    type: PrimitiveType;
    default?: T;
}

export default function primitiveProperty<T>(options: PrimitivePropertyOptions<T>) {
    return function(target: any, propertyKey: string) {
        const constructor = target.constructor;
        if (!constructor.metadata) {
            constructor.metadata = {};
        }
        constructor.metadata[propertyKey] = new PrimitiveProperty(propertyKey, options);
    }
}

export class PrimitiveProperty<T> extends DefinitionProperty {
    readonly type: PrimitiveType;
    readonly default: T;

    constructor(id: string, options: PrimitivePropertyOptions<T>) {
        super(id, options);
        this.type = options.type;
        this.default = options.default;
    }

    getValue(model: BaseModel): T {
        const strata = model.strataTopToBottom;
        for (let i = 0; i < strata.length; ++i) {
            const stratum = strata[i];
            const value = stratum[this.id];
            if (value !== undefined) {
                return value;
            }
        }

        return this.default; // TODO: is it a good idea to have a default?
    }
}
