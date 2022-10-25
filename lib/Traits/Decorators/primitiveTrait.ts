import Result from "../../Core/Result";
import TerriaError from "../../Core/TerriaError";
import { BaseModel } from "../../Models/Definition/Model";
import Trait, { TraitOptions } from "../Trait";

type PrimitiveType = "string" | "number" | "boolean";

export interface PrimitiveTraitOptions<T> extends TraitOptions {
  type: PrimitiveType;
  isNullable?: boolean;
}

export default function primitiveTrait<T>(options: PrimitiveTraitOptions<T>) {
  return function (target: any, propertyKey: string) {
    const constructor = target.constructor;
    if (!constructor.traits) {
      constructor.traits = {};
    }
    constructor.traits[propertyKey] = new PrimitiveTrait(
      propertyKey,
      options,
      constructor
    );
  };
}

export class PrimitiveTrait<T> extends Trait {
  readonly type: PrimitiveType;
  readonly isNullable: boolean;

  constructor(id: string, options: PrimitiveTraitOptions<T>, parent: any) {
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
  ): Result<T | undefined> {
    if (
      typeof jsonValue !== this.type &&
      (!this.isNullable || jsonValue !== null)
    ) {
      return Result.error(
        new TerriaError({
          title: "Invalid property",
          message: `Property ${this.id} is expected to be of type ${
            this.type
          } but instead it is of type ${typeof jsonValue}.`
        })
      );
    }

    return new Result(jsonValue);
  }

  toJson(value: T): any {
    return value;
  }

  isSameType(trait: Trait): boolean {
    return (
      trait instanceof PrimitiveTrait &&
      trait.type === this.type &&
      trait.isNullable === this.isNullable
    );
  }
}
