import ModelTraits from "../Traits/ModelTraits";
import TraitsConstructor from "../Traits/TraitsConstructor";
import addModelStrataView from "./addModelStrataView";
import createStratumInstance from "./createStratumInstance";
import ModelPropertiesFromTraits from "./ModelPropertiesFromTraits";

/**
 * Creates an empty instance implementing `ModelPropertiesFromTraits<Traits>`.
 * All traits will have their default values, if any, or otherwise will be
 * undefined.
 * @param Traits The traits class.
 * @returns The empty instance.
 */
export default function createEmptyModel<
  T extends TraitsConstructor<ModelTraits>
>(Traits: T): ModelPropertiesFromTraits<InstanceType<T>> {
  return addModelStrataView(
    {
      strataTopToBottom: [createStratumInstance(Traits)]
    },
    Traits
  );
}
