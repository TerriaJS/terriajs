import isDefined from "../Core/isDefined";
import { BaseModel } from "../Models/Model";
import StratumFromTraits from "../Models/StratumFromTraits";
import ModelTraits from "./ModelTraits";
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
    const strataTopToBottom = model.strataTopToBottom;
    const stratum: any = strataTopToBottom.find((stratum: any) =>
      isDefined(stratum) && isDefined(stratum[this.id])
    );
    if (isDefined(stratum)) {
      return stratum[this.id];
    }
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
