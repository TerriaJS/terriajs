import createStratumInstance from "../Models/createStratumInstance";
import StratumFromTraits from "../Models/StratumFromTraits";
import ModelTraits from "./ModelTraits";
import TraitsConstructor from "./TraitsConstructor";

export type StrataAccessFunction<T extends ModelTraits> = () => Map<
  string,
  StratumFromTraits<T>
>;

export type StratumGetFunction<
  TSource extends ModelTraits,
  TDerived extends ModelTraits
> = (stratum: StratumFromTraits<TSource>) => StratumFromTraits<TDerived>;

export type StratumSetFunction<
  TSource extends ModelTraits,
  TDerived extends ModelTraits
> = (
  stratum: StratumFromTraits<TSource>,
  value: StratumFromTraits<TDerived> | undefined | null
) => void;

/**
 * A strata map where the strata are obtained from another strata map and
 * a get/set pair.
 */
export default class DerivedStrataMap<
  TSource extends ModelTraits,
  TDerived extends ModelTraits
> implements Map<string, StratumFromTraits<TDerived>> {
  constructor(
    readonly parentTraitsClass: TraitsConstructor<TSource>,
    readonly strataAccessFunction: StrataAccessFunction<TSource>,
    readonly getFunction: StratumGetFunction<TSource, TDerived>,
    readonly setFunction: StratumSetFunction<TSource, TDerived>
  ) {}

  clear(): void {
    this.strataAccessFunction().forEach(value => {
      this.setFunction(value, undefined);
    });
  }
  delete(key: string): boolean {
    const parentValue = this.strataAccessFunction().get(key);
    if (parentValue === undefined) {
      return false;
    }
    const hasValue = this.getFunction(parentValue) !== undefined;
    this.setFunction(parentValue, undefined);
    return hasValue;
  }
  forEach(
    callbackfn: (
      value: StratumFromTraits<TDerived>,
      key: string,
      map: Map<string, StratumFromTraits<TDerived>>
    ) => void,
    thisArg?: any
  ): void {
    this.strataAccessFunction().forEach((parentValue, key) => {
      const value = this.getFunction(parentValue);
      if (value !== undefined) {
        callbackfn.call(thisArg, value, key, this);
      }
    });
  }
  get(key: string): StratumFromTraits<TDerived> | undefined {
    const parentValue = this.strataAccessFunction().get(key);
    return parentValue && this.getFunction(parentValue);
  }
  has(key: string): boolean {
    const parentValue = this.strataAccessFunction().get(key);
    return (
      parentValue !== undefined && this.getFunction(parentValue) !== undefined
    );
  }
  set(
    key: string,
    value: StratumFromTraits<TDerived> | undefined | null
  ): this {
    const parentMap = this.strataAccessFunction();
    let parentValue = parentMap.get(key);
    if (parentValue === undefined) {
      parentValue = createStratumInstance(this.parentTraitsClass);
      parentMap.set(key, parentValue);
    }
    this.setFunction(parentValue, value);
    return this;
  }
  get size(): number {
    // Only count keys that have a value.
    const parentMap = this.strataAccessFunction();
    let count = 0;
    for (let value of parentMap.values()) {
      if (value !== undefined) {
        ++count;
      }
    }
    return count;
  }
  [Symbol.iterator](): IterableIterator<[string, StratumFromTraits<TDerived>]> {
    return this.entries();
  }
  *entries(): IterableIterator<[string, StratumFromTraits<TDerived>]> {
    for (let entry of this.strataAccessFunction().entries()) {
      const parentValue = entry[1];
      const value = this.getFunction(parentValue);
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
  *values(): IterableIterator<StratumFromTraits<TDerived>> {
    for (let entry of this.entries()) {
      yield entry[1];
    }
  }
  get [Symbol.toStringTag](): string {
    return new Map(this.entries()).toString();
  }
}
