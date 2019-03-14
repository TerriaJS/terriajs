import { BaseModel } from "./Model";
import TerriaError from '../Core/TerriaError';

export default function updateModelFromJson(model: BaseModel, stratumName: string, json: any) {
    const traits = model.traits;
    const stratum: any = model.getOrCreateStratum(stratumName);

    Object.keys(json).forEach(propertyName => {
        if (propertyName === 'id' || propertyName === 'type' || propertyName === 'localId') {
            return;
        }

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
            stratum[propertyName] = trait.fromJson(model, stratumName, jsonValue);
        }
    });
}
