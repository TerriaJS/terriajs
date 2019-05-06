import { If } from "../Core/TypeConditionals";
import { Complete, CopyNullAndUndefined } from "../Core/TypeModifiers";
import ModelTraits, { IsValidSimpleTraitType } from "../Traits/ModelTraits";

type SingleTrait<TTrait> = If<
  IsValidSimpleTraitType<NonNullable<TTrait>>,
  TTrait,
  TTrait extends ModelTraits ? ModelPropertiesFromTraits<TTrait> : never
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
type ModelPropertiesFromTraits<TDefinition extends ModelTraits> = Complete<
  {
    readonly [P in keyof TDefinition]: NonNullable<
      TDefinition[P]
    > extends Array<infer TElement>
      ? ArrayTrait<TDefinition[P], TElement> extends infer R
        ? CopyNullAndUndefined<TDefinition[P], R>
        : never
      : SingleTrait<TDefinition[P]> extends infer R
      ? CopyNullAndUndefined<TDefinition[P], R>
      : never
  }
>;

export default ModelPropertiesFromTraits;
