import { If } from "../Core/TypeConditionals";
import { Complete, NotUndefined } from "../Core/TypeModifiers";
import ModelTraits, { ExcludeModelTraitsHidden, IsValidSimpleTraitType } from "../Traits/ModelTraits";

type SingleTrait<TTrait> = If<
    IsValidSimpleTraitType<NonNullable<TTrait>>,
    TTrait,
    TTrait extends ModelTraits ? FlattenedFromTraits<TTrait> : never
>;

type ArrayTrait<TTrait, TElement> = ReadonlyArray<SingleTrait<TElement>>;

/**
 * Transforms a {@link ModelTraits} class into a type usable as a flattened view of multiple strata.
 * All properties of the new type:
 *
 *   * Are read-only.
 *   * May be undefined even if the traits class property has a default or is otherwise not allowed to be undefined.
 *
 * Nested traits classes follow the rules above.
 */
type FlattenedFromTraits<TDefinition extends ModelTraits> = Complete<ExcludeModelTraitsHidden<{
    readonly [P in keyof TDefinition]: NotUndefined<TDefinition[P]> extends Array<infer TElement>
        ? (ArrayTrait<TDefinition[P], TElement> | undefined)
        : (SingleTrait<TDefinition[P]> | undefined);
}>>;

export default FlattenedFromTraits;
