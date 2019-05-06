import TerriaError from "../Core/TerriaError";
import StratumFromTraits from "../Models/StratumFromTraits";
import { BaseModel } from "../Models/Model";
import ModelTraits from "./ModelTraits";
import Trait, { TraitOptions } from "./Trait";
import FlattenedFromTraits from "../Models/FlattenedFromTraits";
import createStratumInstance from "../Models/createStratumInstance";
import TraitsConstructor from "./TraitsConstructor";
import { computed } from "mobx";

export interface ObjectTraitOptions<T extends ModelTraits>
  extends TraitOptions {
  type: TraitsConstructor<T>;
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
  readonly decoratorForFlattened = computed.struct;

  constructor(id: string, options: ObjectTraitOptions<T>) {
    super(id, options);
    this.type = options.type;
  }

  getValue(
    strataTopToBottom: StratumFromTraits<ModelTraits>[]
  ): FlattenedFromTraits<T> | undefined {
    const objectStrata = strataTopToBottom
      .map((stratum: any) => stratum[this.id])
      .filter(stratum => stratum !== undefined);
    if (objectStrata.length === 0) {
      return undefined;
    }

    const ResultType = this.type;
    const result = createStratumInstance(ResultType);
    const resultAny: any = result;

    const traits = ResultType.traits;
    Object.keys(traits).forEach(traitId => {
      resultAny[traitId] = traits[traitId].getValue(objectStrata);
    });

    // TODO: where do we apply defaults for the nested traits instance?

    return resultAny;
  }

  fromJson(
    model: BaseModel,
    stratumName: string,
    jsonValue: any
  ): StratumFromTraits<T> {
    const ResultType = this.type;
    const result: any = new ResultType();

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

  isSameType(trait: Trait): boolean {
    return trait instanceof ObjectTrait && trait.type === this.type;
  }
}
