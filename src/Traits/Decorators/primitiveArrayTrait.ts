import Result from "../../Core/Result";
import TerriaError from "../../Core/TerriaError";
import { BaseModel } from "../../Models/Definition/Model";
import Trait, { TraitOptions } from "../Trait";

type PrimitiveType = "string" | "number" | "boolean";

export interface PrimitiveArrayTraitOptions<T> extends TraitOptions {
  type: PrimitiveType;
  isNullable?: boolean;
}

export default function primitiveArrayTrait<T>(
  options: PrimitiveArrayTraitOptions<T>
) {
  return function (target: any, propertyKey: string) {
    const constructor = target.constructor;
    if (!constructor.traits) {
      constructor.traits = {};
    }
    constructor.traits[propertyKey] = new PrimitiveArrayTrait(
      propertyKey,
      options,
      constructor
    );
  };
}

export class PrimitiveArrayTrait<T> extends Trait {
  readonly type: PrimitiveType;
  readonly isNullable: boolean;

  constructor(id: string, options: PrimitiveArrayTraitOptions<T>, parent: any) {
    super(id, options, parent);
    this.type = options.type;
    this.isNullable = options.isNullable || false;
  }

  getValue(model: BaseModel): T | undefined {
    const strataTopToBottom = model.strataTopToBottom;
    for (let stratum of <IterableIterator<any>>strataTopToBottom.values()) {
      const value = stratum[this.id];
      if (value !== undefined) {
        return value;
      }
    }

    return undefined;
  }

  fromJson(
    model: BaseModel,
    stratumName: string,
    jsonValue: any
  ): Result<T[] | undefined> {
    if (!this.isValidJson(jsonValue)) {
      return Result.error(
        new TerriaError({
          title: "Invalid property",
          message: `Property ${this.id} is expected to be of type ${this.type}[].`
        })
      );
    }

    return new Result(jsonValue);
  }

  toJson(value: T[]): any {
    return value;
  }

  isSameType(trait: Trait): boolean {
    return (
      trait instanceof PrimitiveArrayTrait &&
      trait.type === this.type &&
      trait.isNullable === this.isNullable
    );
  }

  private isValidJson(jsonValue: any): boolean {
    if (jsonValue === null && this.isNullable) {
      return true;
    }

    if (!Array.isArray(jsonValue)) {
      return false;
    }

    return jsonValue.every((item) => typeof item === this.type);
  }
}
