import memoize from "lodash-es/memoize";
import CreateModel from "../Models/Definition/CreateModel";
import ModelTraits from "./ModelTraits";
import TraitsConstructor from "./TraitsConstructor";

// Unlike other places, we use lodash-es/memoize instead of `createTransformer`
// to memoize because this method is called during model class definition stage
// (check objectTrait & objectArrayTrait) and it will always be run outside an
// `autorun` or an `observer`. Therefore, thecall to `createTransformer` will
// not memoize and logs a warning.
const traitsClassToModelClass = memoize(function <T extends ModelTraits>(
  traitsClass: TraitsConstructor<T>
) {
  return CreateModel(traitsClass);
});

export default traitsClassToModelClass;
