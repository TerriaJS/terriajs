import Complete from "../Core/Complete";
import { If, Equals, Extends, And } from "../Core/TypeConditionals";
import { ApplyUndefined, NotUndefined } from "../Core/TypeModifiers";
import ModelTraits, { ExcludeModelTraitsHidden, IsValidSimpleTraitType } from "../Traits/ModelTraits";

type SingleTrait<TTrait> = If<
    IsValidSimpleTraitType<NonNullable<TTrait>>,
    TTrait,
    TTrait extends ModelTraits ? ModelPropertiesFromTraits<TTrait> : never
>;
type ArrayTrait<TTrait, TElement> = ReadonlyArray<SingleTrait<TElement>>;

// type Q = If<IsValidSimpleTraitType<boolean>, boolean, never>;
type R = SingleTrait<boolean>;
// type S<T> = T extends ModelTraits
//     ? ModelPropertiesFromTraits<ModelTraits>
//     : If<Equals<T, boolean>, boolean, never>;
// type U = S<boolean>;
// type V<T> = T extends {wat: true} ? string : ((true | false) extends T ? true : false);
// type X<T> = boolean extends T ? true : false;
// type W = V<true | false>;
// type Y = X<boolean>;

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
    readonly [P in keyof TDefinition]: NotUndefined<TDefinition[P]> extends Array<infer TElement>
        ? ApplyUndefined<TDefinition[P], ArrayTrait<TDefinition[P], TElement>>
        : ApplyUndefined<TDefinition[P], SingleTrait<TDefinition[P]>>;
}>>;

export default ModelPropertiesFromTraits;
