import { computed } from "mobx";
import isDefined from "../../Core/isDefined";
import Result from "../../Core/Result";
import TerriaError from "../../Core/TerriaError";
import createStubCatalogItem from "../../Models/Catalog/createStubCatalogItem";
import { BaseModel } from "../../Models/Definition/Model";
import ModelFactory from "../../Models/Definition/ModelFactory";
import upsertModelFromJson from "../../Models/Definition/upsertModelFromJson";
import ModelReference from "../ModelReference";
import Trait, { TraitOptions } from "../Trait";

export interface ModelArrayTraitOptions extends TraitOptions {
  factory?: ModelFactory;
}

export default function modelReferenceArrayTrait<T>(
  options: ModelArrayTraitOptions
) {
  return function (target: any, propertyKey: string) {
    const constructor = target.constructor;
    if (!constructor.traits) {
      constructor.traits = {};
    }
    constructor.traits[propertyKey] = new ModelReferenceArrayTrait(
      propertyKey,
      options,
      constructor
    );
  };
}

export class ModelReferenceArrayTrait extends Trait {
  readonly decoratorForFlattened = computed.struct;
  private factory: ModelFactory | undefined;

  constructor(id: string, options: ModelArrayTraitOptions, parent: any) {
    super(id, options, parent);
    this.factory = options.factory;
  }

  // This can probably be converted to a general array handler.
  // It takes an optional idProperty. If not specified, the values are themselves IDs.
  // It ensures that each ID is unique and that the topmost stratum wins for a given ID.
  // There can even be properties to control relative ordering of items in different strata.
  getValue(model: BaseModel): ReadonlyArray<ModelReference> {
    const strataTopToBottom = model.strataTopToBottom;
    const result: ModelReference[] = [];

    type IdToBool = { [key: string]: boolean };
    const idMap: IdToBool = {};
    const removedIds: IdToBool = {};

    // Create a single array with all the unique model IDs.
    for (let stratum of <IterableIterator<any>>strataTopToBottom.values()) {
      const modelIdArray: ModelReference[] = stratum[this.id];

      if (modelIdArray) {
        modelIdArray.forEach((modelId) => {
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

  fromJson(
    model: BaseModel,
    stratumName: string,
    jsonValue: any
  ): Result<ReadonlyArray<string> | undefined> {
    // TODO: support removals

    if (!Array.isArray(jsonValue)) {
      return Result.error(
        new TerriaError({
          title: "Invalid property",
          message: `Property ${
            this.id
          } is expected to be an array but instead it is of type ${typeof jsonValue}.`
        })
      );
    }

    const errors: TerriaError[] = [];

    const result = jsonValue
      .map((jsonElement) => {
        if (typeof jsonElement === "string") {
          return jsonElement;
        } else if (typeof jsonElement === "object") {
          if (this.factory === undefined) {
            errors.push(
              new TerriaError({
                title: "Cannot create Model",
                message:
                  "A modelReferenceArrayTrait does not have a factory but it contains an embedded model that does not yet exist."
              })
            );
            return;
          }
          const nestedModel = upsertModelFromJson(
            this.factory,
            model.terria,
            model.uniqueId === undefined ? "/" : model.uniqueId,
            stratumName,
            jsonElement,
            {}
          ).pushErrorTo(errors);

          // Maybe this should throw if undefined?
          return (
            nestedModel?.uniqueId ??
            createStubCatalogItem(model.terria).uniqueId!
          );
        } else {
          errors.push(
            new TerriaError({
              title: "Invalid property",
              message: `Elements of ${
                this.id
              } are expected to be strings or objects but instead are of type ${typeof jsonElement}.`
            })
          );
        }
      })
      .filter(isDefined);
    return new Result(
      result,
      TerriaError.combine(
        errors,
        `Error updating modelReferenceArrayTrait model "${model.uniqueId}" from JSON`
      )
    );
  }

  toJson(value: ReadonlyArray<ModelReference> | undefined): any {
    return value;
  }

  isSameType(trait: Trait): boolean {
    return (
      trait instanceof ModelReferenceArrayTrait &&
      trait.factory === this.factory
    );
  }
}
