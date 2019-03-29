import { Equals, Or } from '../Core/TypeConditionals';
import ModelReference, { RemovedModelId } from './ModelReference';
import Trait from './Trait';

// Traits may be:
// * JSON primitive types: number, string, boolean, null
// * Schemaless JSON-style objects.
// * References to other ModelTraits types.
// * Arrays of any of the above.

class ModelTraits {
    __isModelTraits: true = true;
    static traits: {
        [id: string]: Trait;
    }
}

export type ExcludeModelTraitsHidden<T> = Pick<T, Exclude<keyof T, '__isModelTraits'>>;
export type IsValidSimpleTraitType<T> = Or<
    Equals<T, boolean>,
    Equals<T, ModelReference>,
    Equals<T, object>,
    Equals<T, string>,
    Equals<T, number>,
    Equals<T, null>
>;

export default ModelTraits;
