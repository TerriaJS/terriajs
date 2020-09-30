import ModelTraits from "../Traits/ModelTraits";
import TraitsConstructor from "../Traits/TraitsConstructor";
import ExtendModel from "./ExtendModel";
import ModelType, { BaseModel, ModelConstructor } from "./Model";

export default function CreateModel<T extends TraitsConstructor<ModelTraits>>(
  Traits: T
): ModelConstructor<ModelType<InstanceType<T>>> {
  abstract class BaseWithNoTraits extends BaseModel {
    static readonly TraitsClass = ModelTraits;
  }

  const Model = ExtendModel(
    BaseWithNoTraits as ModelConstructor<BaseModel>,
    Traits
  );
  return Model;
}
