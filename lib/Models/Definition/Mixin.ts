import AbstractConstructor from "../../Core/AbstractConstructor";
import Constructor from "../../Core/Constructor";
import ModelTraits from "../../Traits/ModelTraits";
import Model from "./Model";

export type Mixin<
  BaseType extends Constructor<Model<MixinTraits>>,
  MixinInterface,
  MixinTraits extends ModelTraits
> = BaseType & AbstractConstructor<MixinInterface & Model<MixinTraits>>;
