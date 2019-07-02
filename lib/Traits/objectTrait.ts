import { computed } from "mobx";
import TerriaError from "../Core/TerriaError";
import createStratumInstance from "../Models/createStratumInstance";
import Model, { BaseModel, ModelConstructor } from "../Models/Model";
import saveStratumToJson from "../Models/saveStratumToJson";
import StratumFromTraits from "../Models/StratumFromTraits";
import ModelTraits from "./ModelTraits";
import Trait, { TraitOptions } from "./Trait";
import traitsClassToModelClass from "./traitsClassToModelClass";
import TraitsConstructor from "./TraitsConstructor";

export interface ObjectTraitOptions<T extends ModelTraits>
  extends TraitOptions {
  type: TraitsConstructor<T>;
  modelClass?: ModelConstructor<Model<T>>;
  isNullable?: boolean;
}

export default function objectTrait<T extends ModelTraits>(
  options: ObjectTraitOptions<T>
) {
  return function(target: any, propertyKey: string) {
    const constructor = target.constructor;
    if (!constructor.traits) {
      constructor.traits = {};
    }
    constructor.traits[propertyKey] = new ObjectTrait(propertyKey, options);
  };
}

export class ObjectTrait<T extends ModelTraits> extends Trait {
  readonly type: TraitsConstructor<T>;
  readonly isNullable: boolean;
  readonly decoratorForFlattened = computed.struct;
  readonly modelClass: ModelConstructor<Model<T>>;

  constructor(id: string, options: ObjectTraitOptions<T>) {
    super(id, options);
    this.type = options.type;
    this.isNullable = options.isNullable || false;
    this.modelClass = options.modelClass || traitsClassToModelClass(this.type);
  }

  getValue(model: BaseModel): Model<T> {
    class NestedStrataView implements Map<string, T> {
      constructor(
        readonly parentTraitsClass: TraitsConstructor<ModelTraits>,
        readonly parent: Map<string, StratumFromTraits<ModelTraits>>,
        readonly propertyId: string
      ) {}

      clear(): void {
        this.parent.forEach((value: any) => {
          value[this.propertyId] = undefined;
        });
      }
      delete(key: string): boolean {
        const parentValue: any = this.parent.get(key);
        const hasValue = parentValue[this.propertyId] !== undefined;
        parentValue[this.propertyId] = undefined;
        return hasValue;
      }
      forEach(
        callbackfn: (value: T, key: string, map: Map<string, T>) => void,
        thisArg?: any
      ): void {
        this.parent.forEach((parentValue: any, key: string) => {
          const value = parentValue[this.propertyId];
          callbackfn.call(thisArg, value, key, this);
        });
      }
      get(key: string): T | undefined {
        const parentValue: any = this.parent.get(key);
        if (parentValue !== undefined) {
          return parentValue[this.propertyId];
        }
        return undefined;
      }
      has(key: string): boolean {
        return this.parent.has(key);
      }
      set(key: string, value: T): this {
        let parentValue: any = this.parent.get(key);
        if (parentValue === undefined) {
          parentValue = createStratumInstance(this.parentTraitsClass);
          this.parent.set(key, parentValue);
        }
        parentValue[this.propertyId] = value;
        return this;
      }
      get size(): number {
        return this.parent.size;
      }
      [Symbol.iterator](): IterableIterator<[string, T]> {
        throw new Error("Method not implemented.");
      }
      *entries(): IterableIterator<[string, T]> {
        for (let entry of this.parent.entries()) {
          const parentValue: any = entry[1];
          yield [entry[0], parentValue[this.propertyId]];
        }
      }
      keys(): IterableIterator<string> {
        return this.parent.keys();
      }
      *values(): IterableIterator<T> {
        for (let entry of this.parent.entries()) {
          const parentValue: any = entry[1];
          yield parentValue[this.propertyId];
        }
      }
      [Symbol.toStringTag]: string;
    }

    return new this.modelClass(
      model.uniqueId,
      model.terria,
      new NestedStrataView(model.TraitsClass, model.strata, this.id)
    );
  }

  fromJson(
    model: BaseModel,
    stratumName: string,
    jsonValue: any
  ): StratumFromTraits<T> {
    const ResultType = this.type;
    const result: any = new ResultType();

    if (this.isNullable && jsonValue === null) {
      return jsonValue;
    }

    Object.keys(jsonValue).forEach(propertyName => {
      const trait = ResultType.traits[propertyName];
      if (trait === undefined) {
        throw new TerriaError({
          title: "Unknown property",
          message: `${propertyName} is not a valid sub-property of ${this.id}.`
        });
      }

      const subJsonValue = jsonValue[propertyName];
      if (subJsonValue === undefined) {
        result[propertyName] = undefined;
      } else {
        result[propertyName] = trait.fromJson(model, stratumName, subJsonValue);
      }
    });

    return result;
  }

  toJson(value: StratumFromTraits<T> | undefined): any {
    if (value === undefined) {
      return undefined;
    }

    return saveStratumToJson(this.type.traits, value);
  }

  isSameType(trait: Trait): boolean {
    return (
      trait instanceof ObjectTrait &&
      trait.type === this.type &&
      trait.isNullable === this.isNullable
    );
  }
}
