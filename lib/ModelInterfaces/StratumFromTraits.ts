import ModelTraits from "../Traits/ModelTraits";
import OrUndefined from "../Core/OrUndefined";

type Recurse<TDefinition extends ModelTraits> = {
    [P in keyof TDefinition]: (Exclude<TDefinition[P], undefined> extends Array<infer TElement> ?
        Array<Recurse<OrUndefined<Required<TElement>>>> | undefined :
        Exclude<TDefinition[P], undefined> extends ModelTraits ?
            Recurse<OrUndefined<Required<TDefinition[P]>>> :
            TDefinition[P]);
};

/**
 * Transforms a {@link ModelTraits} class into a type usable as a stratum.
 * All properties of the new type:
 * 
 *   * Can be both GET and SET,
 *   * May be undefined even if the traits class property has a default and is not nullable, and
 * 
 * Nested traits classes follow the rules above.
 */
type StratumFromTraits<TDefinition extends ModelTraits> = Recurse<OrUndefined<Required<TDefinition>>>;

export default StratumFromTraits;

