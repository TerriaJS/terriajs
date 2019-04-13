import ModelTraits from './ModelTraits';
import Trait, { TraitOptions } from './Trait';
import isDefined from '../Core/isDefined';
import StratumFromTraits from '../ModelInterfaces/StratumFromTraits';
import { ModelInterface } from '../Models/Model';

export interface AnyTraitOptions extends TraitOptions {
}

export default function anyTrait(options: TraitOptions) {
    return function(target: any, propertyKey: string) {
        const constructor = target.constructor;
        if (!constructor.traits) {
            constructor.traits = {};
        }
        constructor.traits[propertyKey] = new AnyTrait(propertyKey, options);
    }
}

export class AnyTrait extends Trait {
    constructor(id: string, options: AnyTraitOptions) {
        super(id, options);
    }

    getValue(strataTopToBottom: StratumFromTraits<ModelTraits>[]): any {
        const stratum: any = strataTopToBottom.find((stratum: any) => isDefined(stratum[this.id]));
        if (isDefined(stratum)) {
            return stratum[this.id]
        }
    }

    fromJson<TTraits extends ModelTraits>(model: ModelInterface<TTraits>, stratumName: string, jsonValue: any): any {
        return jsonValue;
    }
}
