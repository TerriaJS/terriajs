import TerriaError from '../Core/TerriaError';
import StratumFromTraits from '../ModelInterfaces/StratumFromTraits';
import { ModelInterface } from '../Models/Model';
import ModelTraits from './ModelTraits';
import Trait, { TraitOptions } from './Trait';

interface TraitsConstructor<T> {
    new(): T;
    traits: {
        [id: string]: Trait;
    };
}

export interface ObjectTraitOptions<T extends ModelTraits> extends TraitOptions {
    type: TraitsConstructor<T>;
}

export default function objectTrait<T extends ModelTraits>(options: ObjectTraitOptions<T>) {
    return function(target: any, propertyKey: string) {
        const constructor = target.constructor;
        if (!constructor.traits) {
            constructor.traits = {};
        }
        constructor.traits[propertyKey] = new ObjectTrait(propertyKey, options);
    }
}

export class ObjectTrait<T extends ModelTraits> extends Trait {
    readonly type: TraitsConstructor<T>;

    constructor(id: string, options: ObjectTraitOptions<T>) {
        super(id, options);
        this.type = options.type;
    }

    getValue(strataTopToBottom: StratumFromTraits<ModelTraits>[]): T | undefined {
        const objectStrata = strataTopToBottom.map((stratum: any) => stratum[this.id]).filter(stratum => stratum !== undefined);
        if (objectStrata.length === 0) {
            return undefined;
        }

        const ResultType = this.type;
        const result = new ResultType();
        const resultAny: any = result;

        const traits = ResultType.traits;
        Object.keys(traits).forEach(traitId => {
            resultAny[traitId] = traits[traitId].getValue(objectStrata);
        });

        return result;
    }

    fromJson<TTraits extends ModelTraits>(model: ModelInterface<TTraits>, stratumName: string, jsonValue: any): T {
        const ResultType = this.type;
        const result: any = new ResultType();

        Object.keys(jsonValue).forEach(propertyName => {
            const trait = ResultType.traits[propertyName];
            if (trait === undefined) {
                throw new TerriaError({
                    title: 'Unknown property',
                    message: `${propertyName} is not a valid sub-property of ${this.id}.`
                });
            }

            const subJsonValue = jsonValue[propertyName];
            if (subJsonValue === undefined) {
                result[propertyName] = undefined;
            } else {
                result[propertyName] = trait.fromJson(model, stratumName, subJsonValue);
            }
        });

        return result;
    }
}
