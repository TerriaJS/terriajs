import { computed, createAtom, decorate, observable, runInAction } from 'mobx';
import * as DeveloperError from 'terriajs-cesium/Source/Core/DeveloperError';

//>>includeStart('debug', pragmas.debug);
import { onBecomeUnobserved } from 'mobx';
//>>includeEnd('debug');

export type DefinitionConstructor<T> = {
    new(): T;
    traits: object;
}

export interface StratumConstructor<T> {
    new(): T;

    /**
     * The value of this property will always be undefined, but it can be used in a TypeScript `typeof`
     * expression to specify the type of the instance returned by `new`ing this type.
     */
    TInstance: T;
}

// Note that we won't need all the function overloads below once this issue is implemented in TypeScript:
// https://github.com/Microsoft/TypeScript/issues/5453

// In the meantime, generate an arbitrary number of overloads by running code like this in node.js:
//
// function withNumber(n) {
//     const numbers = [];
//     for (let i = 1; i <= n; ++i) {
//         numbers.push(i);
//     }

//     const typeParams = numbers.map(n => `T${n} extends keyof TDefinition`).join(', ');
//     const params = numbers.map(n => `property${n}: T${n}`).join(', ');
//     const typeReferences = numbers.map(n => `T${n}`).join(' | ');
//     return `export default function defineStratum<TDefinition, ${typeParams}>(definition: DefinitionConstructor<TDefinition>, ${params}): StratumConstructor<Pick<TDefinition, ${typeReferences}>>;`;
// }

// const overloadsToGenerate = 25;
// for (let i = 1; i <= overloadsToGenerate; ++i) {
//     console.log(withNumber(i));
// }

/**
 * Creates a stratum class containing a subset of the properties in a model's definition.
 * Please note that only properties decorated as a {@link ModelProperty} (e.g. by using
 * `@primitiveTrait({...})` will be included.
 * All properties are observable.
 *
 * @param TDefinition definition The model definition.
 * @param T1 [property1] The name of a property to include in the subset.
 * @param T2 [property2] The name of a property to include in the subset.
 * @param T3 [property3] The name of a property to include in the subset.
 * @param T4 [property4] The name of a property to include in the subset.
 * @param T5 [property5] The name of a property to include in the subset.
 * @param T6 [property6] The name of a property to include in the subset.
 * @param T7 [property7] The name of a property to include in the subset.
 * @param T8 [property8] The name of a property to include in the subset.
 * @param T9 [property9] The name of a property to include in the subset.
 * @param T10 [property10] The name of a property to include in the subset.
 * @param T11 [property11] The name of a property to include in the subset.
 * @param T12 [property12] The name of a property to include in the subset.
 * @param T13 [property13] The name of a property to include in the subset.
 * @param T14 [property14] The name of a property to include in the subset.
 * @param T15 [property15] The name of a property to include in the subset.
 * @param T16 [property16] The name of a property to include in the subset.
 * @param T17 [property17] The name of a property to include in the subset.
 * @param T18 [property18] The name of a property to include in the subset.
 * @param T19 [property19] The name of a property to include in the subset.
 * @param T20 [property20] The name of a property to include in the subset.
 * @param T21 [property21] The name of a property to include in the subset.
 * @param T22 [property22] The name of a property to include in the subset.
 * @param T23 [property23] The name of a property to include in the subset.
 * @param T24 [property24] The name of a property to include in the subset.
 * @param T25 [property25] The name of a property to include in the subset.
 */
export default function defineStratum<TDefinition>(definition: DefinitionConstructor<TDefinition>): StratumConstructor<TDefinition>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1): StratumConstructor<Pick<TDefinition, T1>>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2): StratumConstructor<Pick<TDefinition, T1 | T2>>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3): StratumConstructor<Pick<TDefinition, T1 | T2 | T3>>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4): StratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4>>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5): StratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5>>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6): StratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6>>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7): StratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7>>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8): StratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8>>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9): StratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9>>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10): StratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10>>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11): StratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11>>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12): StratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12>>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13): StratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13>>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition, T14 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13, property14: T14): StratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14>>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition, T14 extends keyof TDefinition, T15 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13, property14: T14, property15: T15): StratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15>>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition, T14 extends keyof TDefinition, T15 extends keyof TDefinition, T16 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13, property14: T14, property15: T15, property16: T16): StratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16>>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition, T14 extends keyof TDefinition, T15 extends keyof TDefinition, T16 extends keyof TDefinition, T17 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13, property14: T14, property15: T15, property16: T16, property17: T17): StratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16 | T17>>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition, T14 extends keyof TDefinition, T15 extends keyof TDefinition, T16 extends keyof TDefinition, T17 extends keyof TDefinition, T18 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13, property14: T14, property15: T15, property16: T16, property17: T17, property18: T18): StratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16 | T17 | T18>>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition, T14 extends keyof TDefinition, T15 extends keyof TDefinition, T16 extends keyof TDefinition, T17 extends keyof TDefinition, T18 extends keyof TDefinition, T19 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13, property14: T14, property15: T15, property16: T16, property17: T17, property18: T18, property19: T19): StratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16 | T17 | T18 | T19>>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition, T14 extends keyof TDefinition, T15 extends keyof TDefinition, T16 extends keyof TDefinition, T17 extends keyof TDefinition, T18 extends keyof TDefinition, T19 extends keyof TDefinition, T20 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13, property14: T14, property15: T15, property16: T16, property17: T17, property18: T18, property19: T19, property20: T20): StratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16 | T17 | T18 | T19 | T20>>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition, T14 extends keyof TDefinition, T15 extends keyof TDefinition, T16 extends keyof TDefinition, T17 extends keyof TDefinition, T18 extends keyof TDefinition, T19 extends keyof TDefinition, T20 extends keyof TDefinition, T21 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13, property14: T14, property15: T15, property16: T16, property17: T17, property18: T18, property19: T19, property20: T20, property21: T21): StratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16 | T17 | T18 | T19 | T20 | T21>>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition, T14 extends keyof TDefinition, T15 extends keyof TDefinition, T16 extends keyof TDefinition, T17 extends keyof TDefinition, T18 extends keyof TDefinition, T19 extends keyof TDefinition, T20 extends keyof TDefinition, T21 extends keyof TDefinition, T22 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13, property14: T14, property15: T15, property16: T16, property17: T17, property18: T18, property19: T19, property20: T20, property21: T21, property22: T22): StratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16 | T17 | T18 | T19 | T20 | T21 | T22>>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition, T14 extends keyof TDefinition, T15 extends keyof TDefinition, T16 extends keyof TDefinition, T17 extends keyof TDefinition, T18 extends keyof TDefinition, T19 extends keyof TDefinition, T20 extends keyof TDefinition, T21 extends keyof TDefinition, T22 extends keyof TDefinition, T23 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13, property14: T14, property15: T15, property16: T16, property17: T17, property18: T18, property19: T19, property20: T20, property21: T21, property22: T22, property23: T23): StratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16 | T17 | T18 | T19 | T20 | T21 | T22 | T23>>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition, T14 extends keyof TDefinition, T15 extends keyof TDefinition, T16 extends keyof TDefinition, T17 extends keyof TDefinition, T18 extends keyof TDefinition, T19 extends keyof TDefinition, T20 extends keyof TDefinition, T21 extends keyof TDefinition, T22 extends keyof TDefinition, T23 extends keyof TDefinition, T24 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13, property14: T14, property15: T15, property16: T16, property17: T17, property18: T18, property19: T19, property20: T20, property21: T21, property22: T22, property23: T23, property24: T24): StratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16 | T17 | T18 | T19 | T20 | T21 | T22 | T23 | T24>>;
export default function defineStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition, T14 extends keyof TDefinition, T15 extends keyof TDefinition, T16 extends keyof TDefinition, T17 extends keyof TDefinition, T18 extends keyof TDefinition, T19 extends keyof TDefinition, T20 extends keyof TDefinition, T21 extends keyof TDefinition, T22 extends keyof TDefinition, T23 extends keyof TDefinition, T24 extends keyof TDefinition, T25 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13, property14: T14, property15: T15, property16: T16, property17: T17, property18: T18, property19: T19, property20: T20, property21: T21, property22: T22, property23: T23, property24: T24, property25: T25): StratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16 | T17 | T18 | T19 | T20 | T21 | T22 | T23 | T24 | T25>>;
export default function defineStratum<TDefinition>(definition: DefinitionConstructor<TDefinition>, ...properties: string[]): StratumConstructor<any> {
    if (!properties || properties.length === 0) {
        properties = Object.keys(definition.traits);
    }

    //>>includeStart('debug', pragmas.debug);
    properties.forEach(property => {
        if (!(property in definition.traits)) {
            throw new DeveloperError(`Property "${property}" does not exist or is not decorated as a ModelProperty.`);
        }
    })
    //>>includeEnd('debug');

    class Subset {
        static TInstance: any;
    }

    const decorators: any = {};
    properties.forEach(property => {
        decorators[property] = observable;
    });

    decorate(Subset, decorators);

    return Subset;
}
