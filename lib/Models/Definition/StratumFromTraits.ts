import { If } from "../../Core/TypeConditionals";
import { Complete, NotUndefined } from "../../Core/TypeModifiers";
import ModelTraits, { IsValidSimpleTraitType } from "../../Traits/ModelTraits";

type SingleTrait<TTrait> = If<
  IsValidSimpleTraitType<NonNullable<TTrait>>,
  TTrait,
  TTrait extends ModelTraits ? StratumFromTraits<TTrait> : never
>;

type ArrayTrait<TTrait, TElement> = Array<SingleTrait<TElement>>;

/**
 * Transforms a {@link ModelTraits} class into a type usable as a stratum.
 * All properties of the new type:
 *
 *   * Can be both GET and SET.
 *   * May be undefined even if the traits class property has a default or is otherwise not allowed to be undefined.
 *
 * Nested traits classes follow the rules above.
 */
type StratumFromTraits<TDefinition extends ModelTraits> = Complete<{
  [P in keyof TDefinition]: NotUndefined<TDefinition[P]> extends Array<
    infer TElement
  >
    ? ArrayTrait<TDefinition[P], TElement> | undefined
    : SingleTrait<TDefinition[P]> | undefined;
}>;

export default StratumFromTraits;
