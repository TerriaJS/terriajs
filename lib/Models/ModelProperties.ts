import * as defined from 'terriajs-cesium/Source/Core/defined';
import ModelReference from '../Definitions/ModelReference';
import { observable } from 'mobx';

export interface ModelPropertyOptions {
    name: string,
    description: string,
}

export interface ModelArrayPropertyOptions<T> extends ModelPropertyOptions {
    idProperty: keyof T;
}


export function modelReferenceArrayProperty<T>(options: ModelArrayPropertyOptions<T>) {
    return function(target: any, propertyKey: string) {
        const constructor = target.constructor;
        if (!constructor.metadata) {
            constructor.metadata = {};
        }
        constructor.metadata[propertyKey] = new ModelReferenceArrayProperty<T>(propertyKey, options);
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
    // abstract setValue(model: any, newValue: any): void;
}


// CatalogGroup `items` property:
// 1. Is there an `items` per stratum? Yes.
// 2. Is there a flattened view? Yes.
// 3. Can we modify the flattened view? No, the flattened array is immutable.
// 4. What is the type of `items` in each strata? Array of CatalogMemberDefinition (or derived).
// 5. What is the type of the flattened `items`? CatalogMember[]
// 6. What is the relationship between a CatalogMember's definition strata and the CatalogMemberDefinition nested inside the parent's `items` array? They should be the same instance!
// 7. Is this true of other strata as well, like User and GetCapabilities? Yes.
// 8. How are members from different strata merged? By their `id`.
// 9. How can we remove an item added by a lower strata? With a special `isRemoved` property of the definition.
// 10. Can an item removed in one stratum be re-added in a stratum above it? Yes.
// 11. What if the type changes between strata? The highest stratum defines the type.
// 12. When the type changes, do lower strata properties still affect the new type? Yes.
// 13. What if they're incompatible? They're ignored.


// Each stratum will have its own array of models.
// Models with the same ID should be the same object, even if they're from different strata.
// We need helpers to maintain this invariant.
// Getting the property's value should create a single array with all the unique model instances.
// Setting the property's value should make modifications to the user stratum to make the
// current value match the specified one. i.e. new model instances are added to the user
// stratum array, missing model instances are ... marked deleted?

export class ModelReferenceArrayProperty<T> extends ModelProperty {
    readonly idProperty: keyof T;

    constructor(id: string, options: ModelArrayPropertyOptions<T>) {
        super(id, options);
        this.idProperty = options.idProperty;
    }

    // This can probably be converted to a general array handler.
    // It takes an optional idProperty. If not specified, the values are themselves IDs.
    // It ensures that each ID is unique and that the topmost stratum wins for a given ID.
    // There can even be properties to control relative ordering of items in different strata.
    getValue(model: any): ReadonlyArray<ModelReference> {
        const result = [];
        const idMap = {};
        const removedIds = {};

        // Create a single array with all the unique model IDs.
        const layerNames = model.modelStrata;
        for (let i = layerNames.length - 1; i >= 0; --i) {
            const layerName = layerNames[i];
            const layer = model[layerName];
            const modelIdArray: ModelReference[] = layer[this.id];

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

    // setValue(model: any, newValue: T[], stratum: string = model.defaultStratumToModify) {
    //     // TODO: should we support setting this type of value at all??
    //     const currentModels = this.getValue(model);

    //     const oldIdMap: any = {};
    //     currentModels.forEach(modelInstance => {
    //         const id = modelInstance[this.key];
    //         oldIdMap[id] = modelInstance;
    //     });

    //     const newIdMap: any = {};
    //     newValue.forEach(modelInstance => {
    //         const id = modelInstance[this.key];
    //         newIdMap[id] = modelInstance;

    //         // If this model doesn't exist yet, add it to the topmost layer.
    //         if (oldIdMap[id] === undefined) {
    //         }
    //     });

    //     // Remove all models that exist in currentModels but not newValue


    //     // Setting the property's value should make modifications to the user stratum to make the
    //     // current value match the specified one. i.e. new model instances are added to the user
    //     // stratum array, missing model instances are ... marked deleted?

    //     model[model.defaultStratumToModify][this.id] = newValue;
    // }
}
