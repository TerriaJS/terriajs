import { computed } from "mobx";
import createStratumInstance from "../Models/Definition/createStratumInstance";
import StratumFromTraits from "../Models/Definition/StratumFromTraits";
import ModelTraits from "./ModelTraits";
import Stratified from "./Stratified";
import TraitsConstructor from "./TraitsConstructor";

/**
 * A strata map where the strata are obtained from a sub-property of another
 * parent strata map.
 */
export default class ArrayNestedStrataMap<T extends ModelTraits>
  implements Map<string, StratumFromTraits<T>>
{
  constructor(
    readonly parentModel: Stratified<ModelTraits>,
    readonly parentProperty: string,
    readonly objectTraits: TraitsConstructorWithRemoval<T>,
    readonly objectIdProperty: string | number | symbol,
    readonly objectId: string,
    readonly merge: boolean
  ) {}

  clear(): void {
    this.parentModel.strata.forEach((value: any, key: string) => {
      this.delete(key);
    });
  }

  delete(key: string): boolean {
    const parentValue: any = this.parentModel.strata.get(key);
    if (parentValue === undefined) {
      return false;
    }

    let array: any[] = parentValue[this.parentProperty];
    if (array === undefined) {
      return false;
    }

    const index = array.findIndex((value, index) => {
      const id = getObjectId(this.objectIdProperty, value, index);
      return id === this.objectId;
    });

    if (index < 0) {
      return false;
    }

    array.splice(index, 1);

    return true;
  }

  forEach(
    callbackfn: (
      value: StratumFromTraits<T>,
      key: string,
      map: Map<string, StratumFromTraits<T>>
    ) => void,
    thisArg?: any
  ): void {
    this.strata.forEach(
      (value, key, _) => callbackfn(value, key, this),
      thisArg
    );
  }

  get(key: string): StratumFromTraits<T> | undefined {
    return this.strata.get(key);
  }

  has(key: string): boolean {
    return this.strata.has(key);
  }

  set(key: string, value: StratumFromTraits<T>): this {
    this.delete(key);

    let parentValue: any = this.parentModel.strata.get(key);
    if (parentValue === undefined) {
      parentValue = createStratumInstance(this.parentModel.TraitsClass);
      this.parentModel.strata.set(key, parentValue);
    }

    let array = parentValue[this.parentProperty];
    if (array === undefined) {
      parentValue[this.parentProperty] = [];
      array = parentValue[this.parentProperty];
    }

    (<any>value)[this.objectIdProperty] = this.objectId;
    array.push(value);

    return this;
  }

  get size(): number {
    return this.strata.size;
  }

  [Symbol.iterator](): IterableIterator<[string, StratumFromTraits<T>]> {
    return this.strata.entries();
  }

  entries(): IterableIterator<[string, StratumFromTraits<T>]> {
    return this.strata.entries();
  }

  keys(): IterableIterator<string> {
    return this.strata.keys();
  }

  values(): IterableIterator<StratumFromTraits<T>> {
    return this.strata.values();
  }

  get [Symbol.toStringTag](): string {
    return this.strata.toString();
  }

  @computed
  private get strata(): ReadonlyMap<string, StratumFromTraits<T>> {
    const strataTopToBottom: ReadonlyMap<string, any> =
      this.parentModel.strataTopToBottom;

    const result = new Map<string, StratumFromTraits<T>>();

    // Find the strata that go into this object.
    for (let stratumId of strataTopToBottom.keys()) {
      const stratum = strataTopToBottom.get(stratumId);
      const objectArray = stratum[this.parentProperty];

      if (!objectArray) {
        continue;
      }

      // Find this object in the array, if it exists at all.
      const thisObject = objectArray.find((o: any, i: number) => {
        return getObjectId(this.objectIdProperty, o, i) === this.objectId;
      });

      if (thisObject === undefined) {
        continue;
      }

      if (
        this.objectTraits.isRemoval !== undefined &&
        this.objectTraits.isRemoval(thisObject)
      ) {
        // This object is removed in this stratum, so stop here.
        break;
      }

      // This stratum applies to this object.
      result.set(stratumId, thisObject);

      // If merge is false, only return the top-most strata's object
      if (!this.merge) return result;
    }

    return result;
  }
}

export interface TraitsConstructorWithRemoval<T extends ModelTraits>
  extends TraitsConstructor<T> {
  isRemoval?: (instance: StratumFromTraits<T>) => boolean;
}

export function getObjectId(
  idProperty: string | number | symbol,
  object: any,
  index: number
): string {
  if (idProperty === "index") {
    if (object.index === undefined) {
      return index.toString();
    } else {
      return object.index.toString();
    }
  } else {
    return object[idProperty];
  }
}
