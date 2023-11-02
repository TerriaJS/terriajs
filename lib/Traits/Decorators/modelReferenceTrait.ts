import { computed } from "mobx";
import Result from "../../Core/Result";
import TerriaError from "../../Core/TerriaError";
import createStubCatalogItem from "../../Models/Catalog/createStubCatalogItem";
import { BaseModel } from "../../Models/Definition/Model";
import ModelFactory from "../../Models/Definition/ModelFactory";
import upsertModelFromJson from "../../Models/Definition/upsertModelFromJson";
import Trait, { TraitOptions } from "../Trait";

export interface ModelTraitOptions extends TraitOptions {
  modelParentId?: string;
  factory?: ModelFactory;
}

export default function modelReferenceTrait<T>(options: ModelTraitOptions) {
  return function (target: any, propertyKey: string) {
    const constructor = target.constructor;
    if (!constructor.traits) {
      constructor.traits = {};
    }
    constructor.traits[propertyKey] = new ModelReferenceTrait(
      propertyKey,
      options,
      constructor
    );
  };
}

export class ModelReferenceTrait extends Trait {
  readonly decoratorForFlattened = computed.struct;
  private readonly factory: ModelFactory | undefined;
  private readonly modelParentId: string | undefined;

  constructor(id: string, options: ModelTraitOptions, parent: any) {
    super(id, options, parent);
    this.factory = options.factory;
    this.modelParentId = options.modelParentId;
  }

  getValue(model: BaseModel): BaseModel | undefined {
    const strataTopToBottom = model.strataTopToBottom;

    for (let stratum of <IterableIterator<any>>strataTopToBottom.values()) {
      const value = stratum[this.id];
      if (value !== undefined) {
        return value;
      }
    }

    return undefined;
  }

  fromJson(model: BaseModel, stratumName: string, jsonValue: any): Result<any> {
    const errors: TerriaError[] = [];

    let result;
    if (typeof jsonValue === "string") {
      result = jsonValue;
    } else if (typeof jsonValue === "object") {
      if (this.factory === undefined) {
        errors.push(
          new TerriaError({
            title: "Cannot create Model",
            message:
              "A modelReferenceTrait does not have a factory but it contains an embedded model that does not yet exist."
          })
        );
      } else {
        const newModel = upsertModelFromJson(
          this.factory,
          model.terria,
          model.uniqueId === undefined
            ? this.modelParentId
              ? this.modelParentId
              : "/"
            : model.uniqueId,
          stratumName,
          jsonValue,
          {}
        ).catchError((error) => errors.push(error));
        result =
          newModel?.uniqueId ?? createStubCatalogItem(model.terria).uniqueId!;
      }
    } else {
      errors.push(
        new TerriaError({
          title: "Invalid property",
          message: `Elements of ${
            this.id
          } are expected to be strings or objects but instead are of type ${typeof jsonValue}.`
        })
      );
    }

    return new Result(
      result,
      TerriaError.combine(
        errors,
        `Error updating model "${model.uniqueId}" from JSON`
      )
    );
  }

  toJson(value: BaseModel | undefined): any {
    return value;
  }

  isSameType(trait: Trait): boolean {
    return (
      trait instanceof ModelReferenceTrait && trait.factory === this.factory
    );
  }
}
