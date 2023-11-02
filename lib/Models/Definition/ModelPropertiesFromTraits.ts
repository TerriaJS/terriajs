import { If } from "../../Core/TypeConditionals";
import { Complete, NotUndefined } from "../../Core/TypeModifiers";
import ModelTraits, { IsValidSimpleTraitType } from "../../Traits/ModelTraits";
import Model from "./Model";

type SingleTrait<TTrait> = If<
  IsValidSimpleTraitType<NonNullable<TTrait>>,
  TTrait,
  TTrait extends ModelTraits ? Model<TTrait> : never
>;
type ArrayTrait<TTrait, TElement> = ReadonlyArray<SingleTrait<TElement>>;

/**
 * Transforms a {@link ModelTraits} class into a type representative of the traits properties exposed on
 * a {@link Model} class. All properties of the new type:
 *
 *   * Are read-only.
 *   * Do not allow undefined if the trait property itself does not allow undefined (i.e. it's not optional).
 *
 * Nested traits classes follow the rules above.
 */
type ModelPropertiesFromTraits<TDefinition extends ModelTraits> =
  ModelPropertiesFromCompleteTraits<Complete<TDefinition>>;

type ModelPropertiesFromCompleteTraits<TDefinition> = {
  readonly [P in keyof TDefinition]: NotUndefined<TDefinition[P]> extends Array<
    infer TElement
  >
    ? ArrayTrait<NotUndefined<TDefinition[P]>, TElement>
    : SingleTrait<TDefinition[P]>;
};

export default ModelPropertiesFromTraits;
