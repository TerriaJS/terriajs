import OrUndefined from "../Core/OrUndefined";
import ModelTraits from "../Traits/ModelTraits";

type Recurse<TDefinition extends ModelTraits> = {
    readonly [P in keyof TDefinition]: (Exclude<TDefinition[P], undefined> extends Array<infer TElement> ?
        ReadonlyArray<Recurse<OrUndefined<Required<TElement>>>> | undefined :
        Exclude<TDefinition[P], undefined> extends ModelTraits ?
            Recurse<OrUndefined<Required<TDefinition[P]>>> :
            Readonly<TDefinition[P]>);
};

/**
 * Transforms a {@link ModelTraits} class into a type usable as a flattened view of multiple strata.
 * All properties of the new type:
 *
 *   * Are read-only.
 *   * May be undefined even if the traits class property has a default or is otherwise not allowed to be undefined.
 *
 * Nested traits classes follow the rules above.
 */
type FlattenedFromTraits<TDefinition extends ModelTraits> = Recurse<OrUndefined<Required<TDefinition>>>;

export default FlattenedFromTraits;
