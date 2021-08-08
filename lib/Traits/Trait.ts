import Result from "../Core/Result";
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
