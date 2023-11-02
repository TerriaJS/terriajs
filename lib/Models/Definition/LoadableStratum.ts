import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import Constructor from "../../Core/Constructor";
import ModelTraits from "../../Traits/ModelTraits";
import TraitsConstructor from "../../Traits/TraitsConstructor";
import { BaseModel } from "./Model";
import StratumFromTraits from "./StratumFromTraits";

export abstract class LoadableStratumClass {
  abstract duplicateLoadableStratum(newModel: BaseModel): this;
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
        set: function (value: any) {
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
  return <any>LoadableStratum;
}

export function isLoadableStratum(x: any): x is LoadableStratumClass {
  return "duplicateLoadableStratum" in x;
}
