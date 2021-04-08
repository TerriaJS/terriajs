import { BaseModel } from "../Models/Model";

export interface TraitOptions {
  name: string;
  description: string;
  required?: boolean;
}

export default abstract class Trait {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly required: boolean;
  readonly decoratorForFlattened?: PropertyDecorator;

  constructor(id: string, options: TraitOptions) {
    this.id = id;
    this.name = options.name;
    this.description = options.description;
    this.required = options.required ?? false;
  }

  protected abstract getValue(model: BaseModel): any;
  abstract fromJson(model: BaseModel, stratumName: string, jsonValue: any): any;
  abstract toJson(value: any): any;

  abstract isSameType(trait: Trait): boolean;

  getValueAndCheckIfRequired(model: BaseModel): any {
    const value = this.getValue(model);
    if (this.required === true && value === undefined) {
      // TODO: what should happen when a required trait is missing?
      console.warn(
        `Required trait ${this.name} is undefined. This could cause unexpected behavior.`
      );
      return undefined;
    }
    return value;
  }
}
