import { If } from "../Core/TypeConditionals";
import { Complete, CopyNull, CopyUndefined } from "../Core/TypeModifiers";
import ModelTraits, { ExcludeModelTraitsHidden, IsValidSimpleTraitType } from "../Traits/ModelTraits";

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
type ModelPropertiesFromTraits<TDefinition extends ModelTraits> = Complete<ExcludeModelTraitsHidden<{
    readonly [P in keyof TDefinition]: NonNullable<TDefinition[P]> extends Array<infer TElement>
        ? CopyNull<TDefinition[P], CopyUndefined<TDefinition[P], ArrayTrait<TDefinition[P], TElement>>>
        : CopyNull<TDefinition[P], CopyUndefined<TDefinition[P], SingleTrait<TDefinition[P]>>>;
}>>;

export default ModelPropertiesFromTraits;
