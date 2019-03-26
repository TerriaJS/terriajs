import ModelTraits from "../Traits/ModelTraits";
import Complete from "../Core/Complete";
import StratumFromTraits from "./StratumFromTraits";
import OrUndefined from "../Core/OrUndefined";

// Flattened properties:
// * Are deeply read-only.
// * May always be undefined, even if there's a default value.

type Recurse<TDefinition extends ModelTraits> = {
    readonly [P in keyof TDefinition]: (Exclude<TDefinition[P], undefined> extends Array<infer TElement> ?
        ReadonlyArray<Recurse<OrUndefined<Required<TElement>>>> | undefined :
        Exclude<TDefinition[P], undefined> extends ModelTraits ?
            Recurse<OrUndefined<Required<TDefinition[P]>>> :
            Readonly<TDefinition[P]>);
};

type FlattenedFromTraits<TDefinition extends ModelTraits> = Recurse<OrUndefined<Required<TDefinition>>>;

export default FlattenedFromTraits;
