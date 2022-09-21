import { computed } from "mobx";
import Result from "../../Core/Result";
import { BaseModel } from "../../Models/Definition/Model";
import Trait, { TraitOptions } from "../Trait";

export interface AnyTraitOptions extends TraitOptions {}

export default function anyTrait(options: TraitOptions) {
  return function (target: any, propertyKey: string) {
    const constructor = target.constructor;
    if (!constructor.traits) {
      constructor.traits = {};
    }
    constructor.traits[propertyKey] = new AnyTrait(
      propertyKey,
      options,
      constructor
    );
  };
}

export class AnyTrait extends Trait {
  readonly decoratorForFlattened = computed.struct;

  constructor(id: string, options: AnyTraitOptions, parent: any) {
    super(id, options, parent);
  }

  getValue(model: BaseModel): any {
    for (let stratum of model.strataTopToBottom.values()) {
      const stratumAny: any = stratum;
      if (stratumAny !== undefined && stratumAny[this.id] !== undefined) {
        return stratumAny[this.id];
      }
    }
    return undefined;
  }

  fromJson(model: BaseModel, stratumName: string, jsonValue: any): Result<any> {
    return new Result(jsonValue);
  }

  toJson(value: any): any {
    return value;
  }

  isSameType(trait: Trait): boolean {
    return trait instanceof AnyTrait;
  }
}
