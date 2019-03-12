import TerriaError from '../Core/TerriaError';
import StratumFromTraits from '../ModelInterfaces/StratumFromTraits';
import { ModelInterface } from '../Models/Model';
import ModelTraits from './ModelTraits';
import Trait, { TraitOptions } from './Trait';

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
    readonly default?: T;

    constructor(id: string, options: PrimitiveTraitOptions<T>) {
        super(id, options);
        this.type = options.type;
        this.default = options.default;
    }

    getValue(strataTopToBottom: StratumFromTraits<ModelTraits>[]): T | undefined {
        for (let i = 0; i < strataTopToBottom.length; ++i) {
            const stratum: any = strataTopToBottom[i];
            const value = stratum[this.id];
            if (value !== undefined) {
                return value;
            }
        }

        return this.default; // TODO: is it a good idea to have a default?
    }

    fromJson<TTraits extends ModelTraits>(model: ModelInterface<TTraits>, stratumName: string, jsonValue: any): T {
        if (typeof jsonValue !== this.type) {
            throw new TerriaError({
                title: 'Invalid property',
                message: `Property ${this.id} is expected to be of type ${this.type} but instead it is of type ${typeof jsonValue}.`
            });
        }

        return jsonValue;
    }
}
