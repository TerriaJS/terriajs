import { JSONSchema7 } from "json-schema";
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

export type TraitJsonSpec = JSONSchema7 & { [key: string]: any };

export interface TraitJsonSpecContext {
  definitions: Record<string, TraitJsonSpec>;
  visitedTraits: Set<string>;
}

interface BuildJsonSpecOptions {
  includeDefault?: boolean;
  example?: any;
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

  abstract toJsonSpec(
    model: BaseModel,
    context: TraitJsonSpecContext
  ): TraitJsonSpec;

  abstract isSameType(trait: Trait): boolean;

  protected buildJsonSpec(
    base: TraitJsonSpec,
    model?: BaseModel,
    options?: BuildJsonSpecOptions
  ): TraitJsonSpec {
    const spec: TraitJsonSpec = {
      title: this.name,
      description: this.description,
      ...base
    };

    if (options?.includeDefault && model) {
      const defaultValue = this.getValue(model);
      if (defaultValue !== undefined) {
        spec.default = defaultValue;
      }
    }

    const example =
      options?.example ??
      (this as any).example ??
      (this.constructor as any).example;
    if (example !== undefined) {
      spec.examples = [example];
    }

    Object.keys(spec).forEach((key) => {
      const value = (spec as any)[key];
      if (value === undefined) {
        delete (spec as any)[key];
      }
    });

    return spec;
  }
}
