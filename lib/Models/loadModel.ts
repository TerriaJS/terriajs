import { ModelInterface } from "./Model";
import ModelTraits from "../Traits/ModelTraits";
import * as TerriaError from '../Core/TerriaError';

export default function loadModel<TTraits extends ModelTraits>(model: ModelInterface<TTraits>, stratumName: string, json: any) {
    const traits = model.traits;
    const stratum: any = model.addStratum(stratumName);

    Object.keys(json).forEach(propertyName => {
        const trait = traits[propertyName];
        if (trait === undefined) {
            throw new TerriaError({
                title: 'Unknown property',
                message: `The property ${propertyName} is not valid for type ${model.type}.`
            });
        }

        const jsonValue = json[propertyName];
        if (jsonValue === undefined) {
            stratum[propertyName] = undefined;
        } else {
            stratum[propertyName] = trait.fromJson(jsonValue);
        }
    })
}
