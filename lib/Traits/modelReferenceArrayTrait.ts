import TerriaError from '../Core/TerriaError';
import StratumFromTraits from '../ModelInterfaces/StratumFromTraits';
import { ModelInterface } from '../Models/Model';
import ModelFactory from '../Models/ModelFactory';
import upsertModelFromJson from '../Models/upsertModelFromJson';
import ModelReference from "./ModelReference";
import ModelTraits from "./ModelTraits";
import Trait, { TraitOptions } from "./Trait";

export interface ModelArrayTraitOptions extends TraitOptions {
    factory?: ModelFactory;
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
    private factory: ModelFactory | undefined;

    constructor(id: string, options: ModelArrayTraitOptions) {
        super(id, options);
        this.factory = options.factory;
    }

    // This can probably be converted to a general array handler.
    // It takes an optional idProperty. If not specified, the values are themselves IDs.
    // It ensures that each ID is unique and that the topmost stratum wins for a given ID.
    // There can even be properties to control relative ordering of items in different strata.
    getValue(strataTopToBottom: StratumFromTraits<ModelTraits>[]): ReadonlyArray<ModelReference> {
        const result: ModelReference[] = [];

        type IdToBool = { [key: string]: boolean };
        const idMap: IdToBool = {};
        const removedIds: IdToBool = {};

        // Create a single array with all the unique model IDs.
        for (let i = 0; i < strataTopToBottom.length; ++i) {
            const stratum: any = strataTopToBottom[i];
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

    fromJson<TTraits extends ModelTraits>(model: ModelInterface<TTraits>, stratumName: string, jsonValue: any): ReadonlyArray<ModelReference> {
        // TODO: support removals

        if (!Array.isArray(jsonValue)) {
            throw new TerriaError({
                title: 'Invalid property',
                message: `Property ${this.id} is expected to be an array but instead it is of type ${typeof jsonValue}.`
            });
        }

        const result = jsonValue.map(jsonElement => {
            if (typeof jsonElement === 'string') {
                return jsonElement;
            } else if (typeof jsonElement === 'object') {
                if (this.factory === undefined) {
                    throw new TerriaError({
                        title: 'Cannot create Model',
                        message: 'A modelReferenceArrayTrait does not have a factory but it contains an embedded model that does not yet exist.'
                    });
                }

                const nestedModel = upsertModelFromJson(this.factory, model.terria, model.id, undefined, stratumName, jsonElement);
                return nestedModel.id;
            } else {
                throw new TerriaError({
                    title: 'Invalid property',
                    message: `Elements of ${this.id} are expected to be strings or objects but instead are of type ${typeof jsonElement}.`
                });
            }
        });

        return result;
    }
}
