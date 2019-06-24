import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import { BaseModel } from "../Models/Model";

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

  abstract getValue(model: BaseModel): any;
  abstract fromJson(model: BaseModel, stratumName: string, jsonValue: any): any;
  abstract toJson(value: any): any;

  abstract isSameType(trait: Trait): boolean;
}
