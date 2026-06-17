import { observable } from "mobx";
import ModelTraits from "../../Traits/ModelTraits";
import TraitsConstructor from "../../Traits/TraitsConstructor";
import StratumFromTraits from "./StratumFromTraits";
import { BaseModel } from "./Model";

/**
 * Creates a mutable stratum of a given type.
 * @param Traits The traits class for which to create a stratum.
 * @returns The stratum instance.
 */
function createStratumInstance<T extends TraitsConstructor<ModelTraits>>(
  Traits: T,
  values?: Partial<StratumFromTraits<InstanceType<T>>>
): StratumFromTraits<InstanceType<T>>;
function createStratumInstance(
  model: BaseModel,
  values?: any
): StratumFromTraits<ModelTraits>;
function createStratumInstance(
  traitsSource: { traits: any },
  values?: any
): StratumFromTraits<ModelTraits> {
  const defaults: any = values || {};
  const traits = traitsSource.traits;
  const propertyNames = Object.keys(traits);
  const reduced: any = propertyNames.reduce(
    (p, c) => ({ ...p, [c]: defaults[c] }),
    {}
  );
  return observable(reduced);
}

export default createStratumInstance;
