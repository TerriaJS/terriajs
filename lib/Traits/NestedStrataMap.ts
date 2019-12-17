import ModelTraits from "./ModelTraits";
import TraitsConstructor from "./TraitsConstructor";
import StratumFromTraits from "../Models/StratumFromTraits";
import createStratumInstance from "../Models/createStratumInstance";
import { ObjectTrait } from "./objectTrait";
import { computed } from "mobx";

/**
 * A strata map where the strata are obtained from a sub-property of another
 * parent strata map.
 */
export default class NestedStrataMap<T extends ModelTraits>
  implements Map<string, StratumFromTraits<T>> {
  constructor(
    readonly parentTraitsClass: TraitsConstructor<ModelTraits>,
    readonly parent: Map<string, StratumFromTraits<ModelTraits>>,
    readonly parentProperty: string
  ) {}

  @computed
  get strataNames(): string[] {
    const result = [];
    const strataTopToBottom = this.parent.strataTopToBottom;

    for (let stratumId of <IterableIterator<any>>strataTopToBottom.keys()) {
      result.push(stratumId);

      const stratum = strataTopToBottom.get(stratumId);
      if (stratum && stratum.replace) {
        break;
      }
    }

    return result;
  }

  clear(): void {
    this.parent.forEach((value: any) => {
      value[this.parentProperty] = undefined;
    });
  }
  delete(key: string): boolean {
    const parentValue: any = this.parent.get(key);
    if (parentValue === undefined) {
      return false;
    }
    const hasValue = parentValue[this.parentProperty] !== undefined;
    parentValue[this.parentProperty] = undefined;
    return hasValue;
  }
  forEach(
    callbackfn: (value: StratumFromTraits<T>, key: string, map: Map<string, StratumFromTraits<T>>) => void,
    thisArg?: any
  ): void {
    this.parent.forEach((parentValue: any, key: string) => {
      const value = parentValue[this.parentProperty];
      if (value !== undefined) {
        callbackfn.call(thisArg, value, key, this);
      }
    });
  }
  get(key: string): StratumFromTraits<T> | undefined {
    const parentValue: any = this.parent.get(key);
    return this.fromParent(parentValue);
  }

  private fromParent(parentValue: any): StratumFromTraits<T> | undefined {
    if (!parentValue) {
      return undefined;
    }

    const result = parentValue[this.parentProperty];
    if (parentValue.replace) {
      if (!result) {
        const TraitsClass = (this.parentTraitsClass.traits[this.parentProperty] as ObjectTrait<T>).type;
        const subObject = createStratumInstance(TraitsClass);
        subObject.replace = true;
        return subObject;
      }
    }
  }

  has(key: string): boolean {
    return this.parent.has(key);
  }
  set(key: string, value: StratumFromTraits<T>): this {
    let parentValue: any = this.parent.get(key);
    if (parentValue === undefined) {
      parentValue = createStratumInstance(this.parentTraitsClass);
      this.parent.set(key, parentValue);
    }
    parentValue[this.parentProperty] = value;
    return this;
  }
  get size(): number {
    return this.parent.size;
  }
  [Symbol.iterator](): IterableIterator<[string, StratumFromTraits<T>]> {
    return this.entries();
  }
  *entries(): IterableIterator<[string, StratumFromTraits<T>]> {
    for (let entry of this.parent.entries()) {
      const parentValue: any = entry[1];
      const value = parentValue[this.parentProperty];
      if (value === undefined) {
        continue;
      }
      yield [entry[0], value];
    }
  }
  *keys(): IterableIterator<string> {
    // Only return keys that have a value.
    for (let entry of this.entries()) {
      yield entry[0];
    }
  }
  *values(): IterableIterator<StratumFromTraits<T>> {
    for (let entry of this.parent.entries()) {
      const parentValue: any = entry[1];
      const value = parentValue[this.parentProperty];
      if (value === undefined) {
        continue;
      }
      yield value;
    }
  }
  get [Symbol.toStringTag](): string {
    return new Map(this.entries()).toString();
  }
}
