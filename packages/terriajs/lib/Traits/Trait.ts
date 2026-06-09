import { JsonObject } from "../Core/Json";
import Result from "../Core/Result";
import { BaseModel } from "../Models/Definition/Model";

export interface TraitClassOptions {
  description?: string;
  example?: JsonObject;
}

/** Decorator to set traitClass options (eg `description` of the class) */
export function traitClass(options: TraitClassOptions) {
  return function (target: any) {
    target.description = options.description;
    target.example = options.example;
  };
}

export interface TraitOptions {
  name: string;
  description: string;
}

export default abstract class Trait {
  static description: string | undefined;
  static example: string | undefined;

  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly decoratorForFlattened?: PropertyDecorator;
  readonly parent: any;

  constructor(id: string, options: TraitOptions, parent: any) {
    this.id = id;
    this.name = options.name;
    this.description = options.description;
    this.parent = parent;
  }

  abstract getValue(model: BaseModel): any;
  abstract fromJson(
    model: BaseModel,
    stratumName: string,
    jsonValue: any
  ): Result<any | undefined>;
  abstract toJson(value: any): any;

  abstract isSameType(trait: Trait): boolean;
}
