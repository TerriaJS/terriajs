import { createTransformer } from "mobx-utils";
import CreateModel from "../Models/CreateModel";
import ModelTraits from "./ModelTraits";
import TraitsConstructor from "./TraitsConstructor";

const traitsClassToModelClass = createTransformer(function<
  T extends ModelTraits
>(traitsClass: TraitsConstructor<T>) {
  return CreateModel(traitsClass);
});

export default traitsClassToModelClass;
