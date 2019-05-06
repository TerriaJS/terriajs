import TerriaError from "../Core/TerriaError";
import StratumFromTraits from "../Models/StratumFromTraits";
import { ModelInterface, BaseModel } from "../Models/Model";
import ModelTraits from "./ModelTraits";
import Trait, { TraitOptions } from "./Trait";

type PrimitiveType = "string" | "number" | "boolean";

export interface PrimitiveTraitOptions<T> extends TraitOptions {
  type: PrimitiveType;
  isNullable?: boolean;
}

export default function primitiveTrait<T>(options: PrimitiveTraitOptions<T>) {
  return function(target: any, propertyKey: string) {
    const constructor = target.constructor;
    if (!constructor.traits) {
      constructor.traits = {};
    }
    constructor.traits[propertyKey] = new PrimitiveTrait(propertyKey, options);
  };
}

export class PrimitiveTrait<T> extends Trait {
  readonly type: PrimitiveType;
  readonly isNullable: boolean;

  constructor(id: string, options: PrimitiveTraitOptions<T>) {
    super(id, options);
    this.type = options.type;
    this.isNullable = options.isNullable || false;
  }

  getValue(strataTopToBottom: StratumFromTraits<ModelTraits>[]): T | undefined {
    for (let i = 0; i < strataTopToBottom.length; ++i) {
      const stratum: any = strataTopToBottom[i];
      const value = stratum[this.id];
      if (value !== undefined) {
        return value;
      }
    }

    return undefined;
  }

  fromJson(model: BaseModel, stratumName: string, jsonValue: any): T {
    if (
      typeof jsonValue !== this.type &&
      (!this.isNullable || jsonValue !== null)
    ) {
      throw new TerriaError({
        title: "Invalid property",
        message: `Property ${this.id} is expected to be of type ${
          this.type
        } but instead it is of type ${typeof jsonValue}.`
      });
    }

    return jsonValue;
  }

  isSameType(trait: Trait): boolean {
    return (
      trait instanceof PrimitiveTrait &&
      trait.type === this.type &&
      trait.isNullable === this.isNullable
    );
  }
}
