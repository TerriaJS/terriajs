import { computed } from "mobx";
import TerriaError from "../Core/TerriaError";
import createStratumInstance from "../Models/createStratumInstance";
import Model, { BaseModel, ModelConstructor } from "../Models/Model";
import saveStratumToJson from "../Models/saveStratumToJson";
import StratumFromTraits from "../Models/StratumFromTraits";
import ModelTraits from "./ModelTraits";
import Trait, { TraitOptions } from "./Trait";
import traitsClassToModelClass from "./traitsClassToModelClass";
import TraitsConstructor from "./TraitsConstructor";
import NestedStrataMap from "./NestedStrataMap";

export interface ObjectTraitOptions<T extends ModelTraits>
  extends TraitOptions {
  type: TraitsConstructor<T>;
  modelClass?: ModelConstructor<Model<T>>;
  isNullable?: boolean;
}

export default function objectTrait<T extends ModelTraits>(
  options: ObjectTraitOptions<T>
) {
  return function(target: any, propertyKey: string) {
    const constructor = target.constructor;
    if (!constructor.traits) {
      constructor.traits = {};
    }
    constructor.traits[propertyKey] = new ObjectTrait(propertyKey, options);
  };
}

export class ObjectTrait<T extends ModelTraits> extends Trait {
  readonly type: TraitsConstructor<T>;
  readonly isNullable: boolean;
  readonly decoratorForFlattened = computed.struct;
  readonly modelClass: ModelConstructor<Model<T>>;

  constructor(id: string, options: ObjectTraitOptions<T>) {
    super(id, options);
    this.type = options.type;
    this.isNullable = options.isNullable || false;
    this.modelClass = options.modelClass || traitsClassToModelClass(this.type);
  }

  getValue(model: BaseModel): Model<T> {
    return new this.modelClass(
      undefined,
      model.terria,
      undefined,
      new NestedStrataMap<T>(model.TraitsClass, model.strata, this.id)
    );
  }

  fromJson(
    model: BaseModel,
    stratumName: string,
    jsonValue: any
  ): StratumFromTraits<T> {
    const ResultType = this.type;
    const result: any = new ResultType();

    if (this.isNullable && jsonValue === null) {
      return jsonValue;
    }

    Object.keys(jsonValue).forEach(propertyName => {
      const trait = ResultType.traits[propertyName];
      if (trait === undefined) {
        throw new TerriaError({
          title: "Unknown property",
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

  toJson(value: StratumFromTraits<T> | undefined): any {
    if (value === undefined) {
      return undefined;
    }

    return saveStratumToJson(this.type.traits, value);
  }

  isSameType(trait: Trait): boolean {
    return (
      trait instanceof ObjectTrait &&
      trait.type === this.type &&
      trait.isNullable === this.isNullable
    );
  }
}
