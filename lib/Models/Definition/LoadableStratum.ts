import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import Constructor from "../../Core/Constructor";
import ModelTraits from "../../Traits/ModelTraits";
import TraitsConstructor from "../../Traits/TraitsConstructor";
import StratumFromTraits from "./StratumFromTraits";
import { BaseModel } from "./Model";

export type LockedDownStratum<T extends ModelTraits, Class> = {
  [K in keyof Class]: K extends keyof StratumFromTraits<T>
    ? StratumFromTraits<T>[K]
    : K extends keyof LoadableStratumClass
    ? LoadableStratumClass[K]
    : never;
};

interface LoadableStratumClass {
  duplicateLoadableStratum(newModel: BaseModel): this;

  // Currently the pattern to create members is to call a method on the stratum
  createMembers?(): void;
}

export default function LoadableStratum<
  T extends TraitsConstructor<ModelTraits>
>(
  Traits: T
): Constructor<LoadableStratumClass & StratumFromTraits<InstanceType<T>>> {
  abstract class LoadableStratum {}

  // All traits return undefined by default, and throw if set.
  const traits = Traits.traits;
  Object.keys(traits).forEach((propertyName) => {
    if (!(propertyName in LoadableStratum.prototype)) {
      Object.defineProperty(LoadableStratum.prototype, propertyName, {
        get: function () {
          return undefined;
        },
        set: function (_value: any) {
          throw new DeveloperError(
            "Traits of a LoadableStratum may not be set."
          );
        },
        enumerable: true,
        configurable: true
      });
    }
  });

  // The cast is necessary because TypeScript can't see that we've
  // manually defined all the necessary properties.
  return LoadableStratum as any;
}

export function isLoadableStratum(x: any): x is LoadableStratumClass {
  return "duplicateLoadableStratum" in x;
}
