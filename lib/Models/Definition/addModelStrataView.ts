import { computed, decorate } from "mobx";
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

    // For each trait, we define a hidden trait property that gets decorated
    // using @computed. This lets us define a (non-computed) getter property
    // with traitName can be overriden by child classes. This way, we can
    // workaround the mobx of limitiation of not being able to override
    // computed properties.
    const hiddenTraitProperty = `_trait${traitName}`;
    Object.defineProperty(propertyTarget, hiddenTraitProperty, {
      get: function () {
        const value = trait.getValue(this);
        return value === undefined ? defaultValue : value;
      },
      enumerable: true,
      configurable: true
    });

    Object.defineProperty(propertyTarget, traitName, {
      get: function () {
        return this[hiddenTraitProperty];
      },
      enumerable: true,
      configurable: true
    });

    decorators[hiddenTraitProperty] = trait.decoratorForFlattened || computed;
  });

  decorate(model, decorators);

  return model;
}
