import Trait, { TraitOptions } from "./Trait";
import ModelReference from "./ModelReference";
import ModelTraits from "./ModelTraits";

export interface ModelArrayTraitOptions extends TraitOptions {
}

export default function modelReferenceArrayTrait<T>(options: ModelArrayTraitOptions) {
    return function(target: any, propertyKey: string) {
        const constructor = target.constructor;
        if (!constructor.traits) {
            constructor.traits = {};
        }
        constructor.traits[propertyKey] = new ModelReferenceArrayProperty(propertyKey, options);
    }
}

export class ModelReferenceArrayProperty extends Trait {
    constructor(id: string, options: ModelArrayTraitOptions) {
        super(id, options);
    }

    // This can probably be converted to a general array handler.
    // It takes an optional idProperty. If not specified, the values are themselves IDs.
    // It ensures that each ID is unique and that the topmost stratum wins for a given ID.
    // There can even be properties to control relative ordering of items in different strata.
    getValue(strataTopToBottom: Partial<ModelTraits>[]): ReadonlyArray<ModelReference> {
        const result = [];
        const idMap = {};
        const removedIds = {};

        // Create a single array with all the unique model IDs.
        for (let i = 0; i < strataTopToBottom.length; ++i) {
            const stratum = strataTopToBottom[i];
            const modelIdArray: ModelReference[] = stratum[this.id];

            if (modelIdArray) {
                modelIdArray.forEach(modelId => {
                    if (ModelReference.isRemoved(modelId)) {
                        // This ID is removed in this stratum.
                        removedIds[modelId.removed] = true;
                    } else if (removedIds[modelId]) {
                        // This ID was removed by a stratum above this one, so ignore it.
                        return;
                    } else if (!idMap[modelId]) {
                        // This is the first time we've seen this ID, so add it
                        idMap[modelId] = true;
                        result.push(modelId);
                    }
                });
            }
        }

        // TODO: only freeze in debug builds?
        // TODO: can we instead react to modifications of the array?
        return Object.freeze(result);
    }
}
