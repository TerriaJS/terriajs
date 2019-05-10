import { decorate, computed } from "mobx";
import ModelTraits from "../Traits/ModelTraits";
import TraitsConstructor from "../Traits/TraitsConstructor";
import FlattenedFromTraits from "./FlattenedFromTraits";
import StratumFromTraits from "./StratumFromTraits";

export interface Flattenable<T> {
  readonly id: string;
  readonly strataTopToBottom: T[];
}

export default function createFlattenedStrataView<
  T extends TraitsConstructor<ModelTraits>
>(
  model: Flattenable<FlattenedFromTraits<InstanceType<T>>> | Flattenable<StratumFromTraits<InstanceType<T>>>,
  Traits: T
): FlattenedFromTraits<InstanceType<T>> {
  const traits = Traits.traits;

  const flattened: any = {
    id: model.id + ":flattened"
  };

  const decorators: { [id: string]: PropertyDecorator } = {};

  Object.keys(traits).forEach(traitName => {
    const trait = traits[traitName];

    Object.defineProperty(flattened, traitName, {
      get: function() {
        return trait.getValue(model.strataTopToBottom);
      },
      enumerable: true,
      configurable: true
    });

    decorators[traitName] = trait.decoratorForFlattened || computed;
  });

  decorate(flattened, decorators);

  return flattened;
}
