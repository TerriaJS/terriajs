import Trait, { TraitOptions } from './Trait';
import { BaseModel } from '../Models/Model';

type PrimitiveType = 'string' | 'number' | 'boolean';

export interface PrimitiveTraitOptions<T> extends TraitOptions {
    type: PrimitiveType;
    default?: T;
}

export default function primitiveTrait<T>(options: PrimitiveTraitOptions<T>) {
    return function(target: any, propertyKey: string) {
        const constructor = target.constructor;
        if (!constructor.traits) {
            constructor.traits = {};
        }
        constructor.traits[propertyKey] = new PrimitiveTrait(propertyKey, options);
    }
}

export class PrimitiveTrait<T> extends Trait {
    readonly type: PrimitiveType;
    readonly default: T;

    constructor(id: string, options: PrimitiveTraitOptions<T>) {
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
