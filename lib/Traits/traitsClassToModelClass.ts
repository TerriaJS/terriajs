import memoize from "lodash-es/memoize";
import CreateModel from "../Models/CreateModel";
import ModelTraits from "./ModelTraits";
import TraitsConstructor from "./TraitsConstructor";

const traitsClassToModelClass = memoize(function<T extends ModelTraits>(
  traitsClass: TraitsConstructor<T>
) {
  return CreateModel(traitsClass);
});

export default traitsClassToModelClass;
