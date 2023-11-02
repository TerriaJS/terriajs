import { computed } from "mobx";
import Result from "../../Core/Result";
import TerriaError from "../../Core/TerriaError";
import createStratumInstance from "../../Models/Definition/createStratumInstance";
import Model, {
  BaseModel,
  ModelConstructor
} from "../../Models/Definition/Model";
import saveStratumToJson from "../../Models/Definition/saveStratumToJson";
import StratumFromTraits from "../../Models/Definition/StratumFromTraits";
import ModelTraits from "../ModelTraits";
import NestedStrataMap from "../NestedStrataMap";
import Trait, { TraitOptions } from "../Trait";
import traitsClassToModelClass from "../traitsClassToModelClass";
import TraitsConstructor from "../TraitsConstructor";

export interface ObjectTraitOptions<T extends ModelTraits>
  extends TraitOptions {
  type: TraitsConstructor<T>;
  modelClass?: ModelConstructor<Model<T>>;
  isNullable?: boolean;
}

export default function objectTrait<T extends ModelTraits>(
  options: ObjectTraitOptions<T>
) {
  return function (target: any, propertyKey: string) {
    const constructor = target.constructor;
    if (!constructor.traits) {
      constructor.traits = {};
    }
    constructor.traits[propertyKey] = new ObjectTrait(
      propertyKey,
      options,
      constructor
    );
  };
}

export class ObjectTrait<T extends ModelTraits> extends Trait {
  readonly type: TraitsConstructor<T>;
  readonly isNullable: boolean;
  readonly decoratorForFlattened = computed.struct;
  readonly modelClass: ModelConstructor<Model<T>>;

  constructor(id: string, options: ObjectTraitOptions<T>, parent: any) {
    super(id, options, parent);
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
  ): Result<StratumFromTraits<T> | undefined> {
    const ResultType = this.type;
    const result: any = createStratumInstance(ResultType);

    if (this.isNullable && jsonValue === null) {
      return new Result(jsonValue);
    }

    const errors: TerriaError[] = [];

    Object.keys(jsonValue).forEach((propertyName) => {
      const trait = ResultType.traits[propertyName];
      if (trait === undefined) {
        errors.push(
          new TerriaError({
            title: "Unknown property",
            message: `${propertyName} is not a valid sub-property of ${this.id}.`
          })
        );
        return;
      }

      const subJsonValue = jsonValue[propertyName];
      if (subJsonValue === undefined) {
        result[propertyName] = undefined;
      } else {
        result[propertyName] = trait
          .fromJson(model, stratumName, subJsonValue)
          .pushErrorTo(errors);
      }
    });

    return new Result(
      result,
      TerriaError.combine(
        errors,
        `Error${
          errors.length !== 1 ? "s" : ""
        } occurred while updating objectTrait model "${
          model.uniqueId
        }" from JSON`
      )
    );
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
