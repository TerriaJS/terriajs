import { BaseModel } from "../Models/Model";
import Trait, { TraitOptions } from "./Trait";

export interface AnyTraitOptions extends TraitOptions {}

export default function anyTrait(options: TraitOptions) {
  return function(target: any, propertyKey: string) {
    const constructor = target.constructor;
    if (!constructor.traits) {
      constructor.traits = {};
    }
    constructor.traits[propertyKey] = new AnyTrait(propertyKey, options);
  };
}

export class AnyTrait extends Trait {
  constructor(id: string, options: AnyTraitOptions) {
    super(id, options);
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

  fromJson(model: BaseModel, stratumName: string, jsonValue: any): any {
    return jsonValue;
  }

  toJson(value: any): any {
    return value;
  }

  isSameType(trait: Trait): boolean {
    return trait instanceof AnyTrait;
  }
}
