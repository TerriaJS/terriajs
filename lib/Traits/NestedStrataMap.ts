import ModelTraits from "./ModelTraits";
import TraitsConstructor from "./TraitsConstructor";
import StratumFromTraits from "../Models/Definition/StratumFromTraits";
import createStratumInstance from "../Models/Definition/createStratumInstance";

/**
 * A strata map where the strata are obtained from a sub-property of another
 * parent strata map.
 */
export default class NestedStrataMap<T extends ModelTraits>
  implements Map<string, T>
{
  constructor(
    readonly parentTraitsClass: TraitsConstructor<ModelTraits>,
    readonly parent: Map<string, StratumFromTraits<ModelTraits>>,
    readonly parentProperty: string
  ) {}

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
    callbackfn: (value: T, key: string, map: Map<string, T>) => void,
    thisArg?: any
  ): void {
    this.parent.forEach((parentValue: any, key: string) => {
      const value = parentValue[this.parentProperty];
      if (value !== undefined) {
        callbackfn.call(thisArg, value, key, this);
      }
    });
  }
  get(key: string): T | undefined {
    const parentValue: any = this.parent.get(key);
    return parentValue && parentValue[this.parentProperty];
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
    parentValue[this.parentProperty] = value;
    return this;
  }
  get size(): number {
    return this.parent.size;
  }
  [Symbol.iterator](): IterableIterator<[string, T]> {
    return this.entries();
  }
  *entries(): IterableIterator<[string, T]> {
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
  *values(): IterableIterator<T> {
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
