import ModelTraits from "../Traits/ModelTraits";
import Complete from "../Core/Complete";
import AllowsUndefined from "../Core/AllowsUndefined";

// Model properties:
// * Are deeply read-only
// * May only be undefined if the trait does not have a default value.

type Recurse<TDefinition extends ModelTraits> = {
    readonly [P in keyof TDefinition]: (Exclude<TDefinition[P], undefined> extends Array<infer TElement>
        ? (AllowsUndefined<TDefinition[P]> extends true
            ? ReadonlyArray<ModelPropertiesFromTraits<TElement>> | undefined
            : ReadonlyArray<ModelPropertiesFromTraits<TElement>>)
        : (Exclude<TDefinition[P], undefined> extends ModelTraits
            ? ModelPropertiesFromTraits<TDefinition[P]>
            : Readonly<TDefinition[P]>));
};

type ModelPropertiesFromTraits<TDefinition extends ModelTraits> = Recurse<Complete<TDefinition>>;

export default ModelPropertiesFromTraits;
