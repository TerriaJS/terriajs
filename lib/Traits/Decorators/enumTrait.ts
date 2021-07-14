import Trait, { TraitOptions } from "../Trait";
import { BaseModel } from "../../Models/Model";
import Result from "../../Core/Result";

export interface EnumTraitOptions<T> extends TraitOptions {
  enum: T;
  allowLabelsAsValue?: boolean;
  isNullable?: boolean;
}

export default function enumTrait<T>(options: EnumTraitOptions<T>) {
  return function(target: any, propertyKey: string) {
    const constructor = target.constructor;
    if (!constructor.traits) {
      constructor.traits = {};
    }
    constructor.traits[propertyKey] = new EnumTrait<T>(propertyKey, options);
  };
}

export class EnumTrait<T> extends Trait {
  private readonly type = "enum";
  readonly enum: T;
  readonly allowLabelsAsValue: boolean;
  readonly isNullable: boolean;

  constructor(id: string, options: EnumTraitOptions<T>) {
    super(id, options);
    this.enum = options.enum;
    this.allowLabelsAsValue = options.allowLabelsAsValue ?? false;
    this.isNullable = options.isNullable ?? false;
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
    if (this.isNullable && jsonValue === null) {
      return Result.return(jsonValue);
    }

    if (!isValidEnumValue(this.enum, jsonValue, this.allowLabelsAsValue)) {
      const validValues = this.getValidValues();
      return Result.error({
        title: "Invalid enum",
        message: `Invalid enum value (${jsonValue}) received in property ${
          this.id
        }. Allowed ${validValues.join(",")}`
      });
    }

    return Result.return(
      getValidEnumValue(this.enum, jsonValue, this.allowLabelsAsValue)
    );
  }

  toJson(value: any): any {
    return value;
  }

  isSameType(trait: Trait): boolean {
    return (
      trait instanceof EnumTrait &&
      trait.type === this.type &&
      trait.isNullable === this.isNullable &&
      trait.allowLabelsAsValue === this.allowLabelsAsValue
    );
  }

  private getValidValues() {
    const validValues = getEnumValues(this.enum);
    if (this.allowLabelsAsValue) {
      for (const label of getEnumLabels(this.enum)) {
        validValues.push(label);
      }
    }
    return validValues;
  }
}

function getEnumLabels(enumDefinition: any) {
  return Object.keys(enumDefinition).filter(
    v => !Number.isFinite(parseInt(v, 10))
  );
}

function getEnumValues(enumDefinition: any): any[] {
  return Object.values(enumDefinition).filter((v: any) => {
    return "number" !== typeof enumDefinition[v];
  }) as any[];
}

function isValidEnumValue(
  enumDefinition: any,
  value: any,
  allowLabelsAsValue: boolean
) {
  if (allowLabelsAsValue) {
    const labels = getEnumLabels(enumDefinition);
    if (labels.indexOf(String(value)) !== -1) {
      return true;
    }
  }

  const values = getEnumValues(enumDefinition);
  return (
    values.indexOf(+value) !== -1 ||
    values.indexOf(value) !== -1 ||
    values.indexOf(String(value)) !== -1
  );
}

function getValidEnumValue(
  enumDefinition: any,
  value: any,
  allowLabelsAsValue = false
) {
  if (allowLabelsAsValue) {
    const labels = getEnumLabels(enumDefinition);
    if (-1 !== labels.indexOf(String(value))) {
      return enumDefinition[String(value)];
    }
  }

  const values = getEnumValues(enumDefinition);
  if (-1 !== values.indexOf(value)) {
    return value;
  }
  if (-1 !== values.indexOf(+value)) {
    return +value;
  }
  if (-1 !== values.indexOf(String(value))) {
    return String(value);
  }
}
