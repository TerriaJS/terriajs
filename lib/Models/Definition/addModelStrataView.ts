import { comparer, computed, IComputedValue } from "mobx";
import ModelTraits from "../../Traits/ModelTraits";
import Stratified from "../../Traits/Stratified";
import TraitsConstructor from "../../Traits/TraitsConstructor";
import ModelPropertiesFromTraits from "./ModelPropertiesFromTraits";

/**
 * Store mobx computed() values for Model traits
 */
const computedTraits: WeakMap<
  any,
  Map<string, IComputedValue<any>>
> = new WeakMap();

/**
 * Adds a set of traits to a model. The values of the traits will be derived
 * from the model's strata.
 * @param model The model class or instance.
 * @param Traits The traits class.
 * @returns The original model, now modified to add the added traits.
 */
export default function addModelStrataView<
  T extends TraitsConstructor<ModelTraits>
>(
  model: Stratified<InstanceType<T>>,
  Traits: T
): ModelPropertiesFromTraits<InstanceType<T>>;
export default function addModelStrataView<
  T extends TraitsConstructor<ModelTraits>
>(model: Function, Traits: T): ModelPropertiesFromTraits<InstanceType<T>>;
export default function addModelStrataView<
  T extends TraitsConstructor<ModelTraits>
>(model: any, Traits: T): ModelPropertiesFromTraits<InstanceType<T>> {
  const traits = Traits.traits;

  const propertyTarget = typeof model === "function" ? model.prototype : model;

  const traitsInstance: any = new Traits();
  Object.keys(traits).forEach((traitName) => {
    const trait = traits[traitName];
    const defaultValue = traitsInstance[traitName];
    Object.defineProperty(propertyTarget, traitName, {
      get: function () {
        let thisComputedTraits = computedTraits.get(this);
        if (!thisComputedTraits) {
          thisComputedTraits = new Map();
          computedTraits.set(this, thisComputedTraits);
        }

        let computedTrait = thisComputedTraits.get(traitName);
        if (!computedTrait) {
          let computedFn: (fn: () => any) => IComputedValue<any> = computed;
          // Find the functional equivalent for trait.decoratorForFlattened
          if (trait.decoratorForFlattened) {
            if (trait.decoratorForFlattened === computed.struct) {
              computedFn = (fn: () => any) =>
                computed(fn, { equals: comparer.structural });
            } else {
              console.error(
                "Unknown value for trait `decoratorForFlattened` option, falling back to 'computed'"
              );
            }
          }

          computedTrait = computedFn(() => trait.getValue(this));
          thisComputedTraits.set(traitName, computedTrait);
        }

        const value = computedTrait.get();
        return value === undefined ? defaultValue : value;
      },
      enumerable: true,
      configurable: true
    });
  });

  return model;
}
