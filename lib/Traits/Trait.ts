import StratumFromTraits from "../Models/StratumFromTraits";
import { BaseModel } from "../Models/Model";
import ModelTraits from "./ModelTraits";
import { IComputed } from "mobx";

export interface TraitOptions {
  name: string;
  description: string;
}

export default abstract class Trait {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly decoratorForFlattened?: PropertyDecorator;

  constructor(id: string, options: TraitOptions) {
    this.id = id;
    this.name = options.name;
    this.description = options.description;
  }

  abstract getValue(strataTopToBottom: StratumFromTraits<ModelTraits>[]): any;

  abstract fromJson(model: BaseModel, stratumName: string, jsonValue: any): any;

  abstract isSameType(trait: Trait): boolean;
}
