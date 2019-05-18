import TerriaError from "../Core/TerriaError";
import StratumFromTraits from "../Models/StratumFromTraits";
import { BaseModel } from "../Models/Model";
import ModelTraits from "./ModelTraits";
import Trait, { TraitOptions } from "./Trait";
import FlattenedFromTraits from "../Models/FlattenedFromTraits";
import createStratumInstance from "../Models/createStratumInstance";
import TraitsConstructor from "./TraitsConstructor";
import { computed } from "mobx";
import ModelPropertiesFromTraits from "../Models/ModelPropertiesFromTraits";
import addModelStrataView from "../Models/addModelStrataView";

export interface ObjectTraitOptions<T extends ModelTraits>
  extends TraitOptions {
  type: TraitsConstructor<T>;
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

  constructor(id: string, options: ObjectTraitOptions<T>) {
    super(id, options);
    this.type = options.type;
    this.isNullable = options.isNullable || false;
  }

  getValue(
    strataTopToBottom: StratumFromTraits<ModelTraits>[]
  ): ModelPropertiesFromTraits<T> | undefined {
    const objectStrata = strataTopToBottom
      .map((stratum: any) => stratum[this.id])
      .filter(stratum => stratum !== undefined);

    if (objectStrata.length === 0) {
      return undefined;
    }

    const model = {
      strataTopToBottom: objectStrata
    };
    addModelStrataView(model, this.type);
    return <any>model;
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

  isSameType(trait: Trait): boolean {
    return (
      trait instanceof ObjectTrait &&
      trait.type === this.type &&
      trait.isNullable === this.isNullable
    );
  }
}
