import AllowsUndefined from "../Core/AllowsUndefined";
import Complete from "../Core/Complete";
import ModelTraits from "../Traits/ModelTraits";

type Recurse<TDefinition extends ModelTraits> = {
    readonly [P in keyof TDefinition]: (Exclude<TDefinition[P], undefined> extends Array<infer TElement>
        ? (AllowsUndefined<TDefinition[P]> extends true
            ? ReadonlyArray<ModelPropertiesFromTraits<TElement>> | undefined
            : ReadonlyArray<ModelPropertiesFromTraits<TElement>>)
        : (Exclude<TDefinition[P], undefined> extends ModelTraits
            ? ModelPropertiesFromTraits<TDefinition[P]>
            : Readonly<TDefinition[P]>));
};

/**
 * Transforms a {@link ModelTraits} class into a type representative of the traits properties exposed on
 * a {@link Model} class. All properties of the new type:
 *
 *   * Are read-only.
 *   * Do not allow undefined if the trait property itself does not allow undefined (i.e. it's not optional).
 *
 * Nested traits classes follow the rules above.
 */
type ModelPropertiesFromTraits<TDefinition extends ModelTraits> = Recurse<Complete<TDefinition>>;

export default ModelPropertiesFromTraits;
