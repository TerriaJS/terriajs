import * as defined from 'terriajs-cesium/Source/Core/defined';

type PrimitiveType = 'string' | 'number' | 'boolean';

export interface ModelPropertyOptions {
    name: string,
    description: string,
}

export interface PrimitivePropertyOptions<T> extends ModelPropertyOptions {
    type: PrimitiveType;
    default?: T;
}

export interface ModelArrayPropertyOptions<T> extends ModelPropertyOptions {
    factory: (type: string) => T;
    idProperty: keyof T;
    typeProperty: keyof T;
}

export function primitiveProperty<T>(options: PrimitivePropertyOptions<T>) {
    return function(target: any, propertyKey: string) {
        const constructor = target.constructor;
        if (!constructor.metadata) {
            constructor.metadata = {};
        }
        constructor.metadata[propertyKey] = new PrimitiveProperty(propertyKey, options);
    }
}

export function modelArrayProperty<T>(options: ModelArrayPropertyOptions<T>) {
    return function(target: any, propertyKey: string) {
        const constructor = target.constructor;
        if (!constructor.metadata) {
            constructor.metadata = {};
        }
        constructor.metadata[propertyKey] = new ModelArrayProperty(propertyKey, options);
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
    abstract setValue(model: any, newValue: any): void;
}

export class PrimitiveProperty<T> extends ModelProperty {
    readonly type: PrimitiveType;
    readonly default: T;

    constructor(id: string, options: PrimitivePropertyOptions<T>) {
        super(id, options);
        this.type = options.type;
        this.default = options.default;
    }

    getValue(model: any): T {
        const layerNames = model.modelStrata;

        // Starting with the topmost layer, find the first layer with a value that is not undefined.
        for (let i = layerNames.length - 1; i >= 0; --i) {
            const layerName = layerNames[i];
            const layer = model[layerName];
            const value = layer[this.id];
            if (value !== undefined) {
                return value;
            }
        }

        return this.default;
    }

    setValue(model: any, newValue: T) {
        model[model.defaultStratumToModify][this.id] = newValue;
    }
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

export class ModelArrayProperty<T> extends ModelProperty {
    readonly key: keyof T;

    constructor(id: string, options: ModelArrayPropertyOptions<T>) {
        super(id, options);
        this.key = options.key;
    }

    getValue(model: any): T[] {
        const layerNames = model.modelStrata;
        const result = [];
        const idMap = {};
        const removedModels = {};

        // Create a single array with all the unique model instances.
        for (let i = layerNames.length - 1; i >= 0; --i) {
            const layerName = layerNames[i];
            const layer = model[layerName];
            const modelArray = layer[this.id];

            if (!modelArray) {
                continue;
            }

            for (const removedModelId in Object.keys(modelArray._removedModels)) {
                removedModels[removedModelId] = true;
            }

            for (let j = 0; j < modelArray.length; ++j) {
                const modelInstance = modelArray[j];
                const modelId = modelInstance[this.key];
                const removed = modelId in removedModels;
                const alreadyInResult = idMap[modelId] !== undefined;

                if (!removed && !alreadyInResult) {
                    result.push(modelInstance);
                    idMap[modelId] = modelInstance;
                }
            }
        }

        return result;
    }

    setValue(model: any, newValue: T[]) {
        const currentModels = this.getValue(model);

        const oldIdMap: any = {};
        currentModels.forEach(modelInstance => {
            const id = modelInstance[this.key];
            oldIdMap[id] = modelInstance;
        });

        const newIdMap: any = {};
        newValue.forEach(modelInstance => {
            const id = modelInstance[this.key];
            newIdMap[id] = modelInstance;

            // If this model doesn't exist yet, add it to the topmost layer.
            if (oldIdMap[id] === undefined) {
            }
        });

        // Remove all models that exist in currentModels but not newValue


        // Setting the property's value should make modifications to the user stratum to make the
        // current value match the specified one. i.e. new model instances are added to the user
        // stratum array, missing model instances are ... marked deleted?

        model[model.defaultStratumToModify][this.id] = newValue;
    }
}
