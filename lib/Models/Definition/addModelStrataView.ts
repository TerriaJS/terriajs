import { computed } from "mobx";
import ModelTraits from "../../Traits/ModelTraits";
import Stratified from "../../Traits/Stratified";
import TraitsConstructor from "../../Traits/TraitsConstructor";
import ModelPropertiesFromTraits from "./ModelPropertiesFromTraits";

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
  /* TODO: Fix this overload type */
  /* eslint-disable-next-line @typescript-eslint/ban-types */
>(model: Function, Traits: T): ModelPropertiesFromTraits<InstanceType<T>>;
export default function addModelStrataView<
  T extends TraitsConstructor<ModelTraits>
>(model: any, Traits: T): ModelPropertiesFromTraits<InstanceType<T>> {
  const traits = Traits.traits;

  const decorators: { [id: string]: PropertyDecorator } = {};

  const propertyTarget = typeof model === "function" ? model.prototype : model;

  const traitsInstance: any = new Traits();
  Object.keys(traits).forEach((traitName) => {
    const trait = traits[traitName];
    const defaultValue = traitsInstance[traitName];
    Object.defineProperty(propertyTarget, traitName, {
      get: function () {
        const value = trait.getValue(this);
        return value === undefined ? defaultValue : value;
      },
      enumerable: true,
      configurable: true
    });

    decorators[traitName] = trait.decoratorForFlattened || computed;
  });

  decorate(model, decorators);

  return model;
}

/**
 * Decorate the target class.
 *
 * Note that we assume that the class constructor calls `makeObservable(this)`
 * to correctly setup the mobx properties.
 *
 * @param target Target class to decorate
 * @param decorators Properties of the class that must be decorated
 */
function decorate(
  target: any,
  decorators: { [id: string]: PropertyDecorator }
) {
  Object.entries(decorators).forEach(([prop, decorator]) => {
    decorator(target.prototype, prop);
  });
}
