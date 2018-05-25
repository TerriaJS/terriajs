import { computed, createAtom, decorate, observable, runInAction } from 'mobx';
import * as DeveloperError from 'terriajs-cesium/Source/Core/DeveloperError';

//>>includeStart('debug', pragmas.debug);
import { onBecomeUnobserved } from 'mobx';
//>>includeEnd('debug');

interface Constructor<T> {
    new(): T;
}

interface DefinitionConstructor<T> {
    new(): T;
    metadata: object;
}

export interface LoadableLayerData {
    isLoading: boolean;
    loadPromise: Promise<void>;
    loadIfNeeded(): Promise<void>;
}

export type LoadableStratumInstance<T> = LoadableLayerData & T;

export interface LoadableStratumConstructor<T> {
    new(load: (value: T) => Promise<void>): LoadableStratumInstance<T>;

    /**
     * The value of this property will always be undefined, but it can be used in a TypeScript `typeof`
     * expression to specify the type of the parameter to the load function.
     */
    TLoadValue: T;

    /**
     * The value of this property will always be undefined, but it can be used in a TypeScript `typeof`
     * expression to specify the type of the instance returned by `new`ing this type.
     */
    TInstance: LoadableStratumInstance<T>;
}


// Note that we won't need all the function overloads below once this issue is implemented in TypeScript:
// https://github.com/Microsoft/TypeScript/issues/5453

// In the meantime, generate an arbitrary number of overloads by running code like this in node.js:
// function withNumber(n) {
//     const numbers = [];
//     for (let i = 1; i <= n; ++i) {
//         numbers.push(i);
//     }

//     const typeParams = numbers.map(n => `T${n} extends keyof TDefinition`).join(', ');
//     const params = numbers.map(n => `property${n}: T${n}`).join(', ');
//     const typeReferences = numbers.map(n => `T${n}`).join(' | ');
//     return `export default function defineLoadableStratum<TDefinition, ${typeParams}>(definition: DefinitionConstructor<TDefinition>, ${params}): LoadableStratumConstructor<Pick<TDefinition, ${typeReferences}>>;`;
// }

// const overloadsToGenerate = 25;
// for (let i = 1; i <= overloadsToGenerate; ++i) {
//     console.log(withNumber(i));
// }

/**
 * Creates a loadable stratum class containing a subset of the properties in a model's definition. The stratum is loaded asynchronously,
 * via a load callback provided to the constructor, the first time any of the properties are accessed. If the load function accesses
 * any MobX observables, the stratum will automatically re-load when any of the accessed observables change. For example, if the URL
 * to load from is an observable property, and the URL changes after the initial load is complete, a new load will be triggered.
 * While a load is in progress, all properties of the stratum will be undefined, even if a previous load has provided values.
 * All properties are observable.
 *
 * If you get a compiler error when calling this function saying that your value class is not assignable to `Constructor<Pick<...>>`,
 * verify that all specified properties actually exist on your value class.
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
export default function defineLoadableStratum<TDefinition, TValue extends TDefinition>(definition: DefinitionConstructor<TDefinition>, value: Constructor<TValue>) : LoadableStratumConstructor<TValue>;
export default function defineLoadableStratum<TDefinition, TValue extends Pick<TDefinition, T1>, T1 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, value: Constructor<TValue>, property1: T1): LoadableStratumConstructor<TValue>;
export default function defineLoadableStratum<TDefinition, TValue extends Pick<TDefinition, T1 | T2>, T1 extends keyof TDefinition, T2 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, value: Constructor<TValue>, property1: T1, property2: T2): LoadableStratumConstructor<TValue>;
export default function defineLoadableStratum<TDefinition, TValue extends Pick<TDefinition, T1 | T2 | T3>, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, value: Constructor<TValue>, property1: T1, property2: T2, property3: T3): LoadableStratumConstructor<TValue>;
export default function defineLoadableStratum<TDefinition, TValue extends Pick<TDefinition, T1 | T2 | T3 | T4>, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, value: Constructor<TValue>, property1: T1, property2: T2, property3: T3, property4: T4): LoadableStratumConstructor<TValue>;
// export default function defineLoadableStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5): LoadableStratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5>>;
// export default function defineLoadableStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6): LoadableStratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6>>;
// export default function defineLoadableStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7): LoadableStratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7>>;
// export default function defineLoadableStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8): LoadableStratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8>>;
// export default function defineLoadableStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9): LoadableStratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9>>;
// export default function defineLoadableStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10): LoadableStratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10>>;
// export default function defineLoadableStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11): LoadableStratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11>>;
// export default function defineLoadableStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12): LoadableStratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12>>;
// export default function defineLoadableStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13): LoadableStratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13>>;
// export default function defineLoadableStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition, T14 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13, property14: T14): LoadableStratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14>>;
// export default function defineLoadableStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition, T14 extends keyof TDefinition, T15 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13, property14: T14, property15: T15): LoadableStratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15>>;
// export default function defineLoadableStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition, T14 extends keyof TDefinition, T15 extends keyof TDefinition, T16 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13, property14: T14, property15: T15, property16: T16): LoadableStratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16>>;
// export default function defineLoadableStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition, T14 extends keyof TDefinition, T15 extends keyof TDefinition, T16 extends keyof TDefinition, T17 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13, property14: T14, property15: T15, property16: T16, property17: T17): LoadableStratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16 | T17>>;
// export default function defineLoadableStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition, T14 extends keyof TDefinition, T15 extends keyof TDefinition, T16 extends keyof TDefinition, T17 extends keyof TDefinition, T18 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13, property14: T14, property15: T15, property16: T16, property17: T17, property18: T18): LoadableStratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16 | T17 | T18>>;
// export default function defineLoadableStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition, T14 extends keyof TDefinition, T15 extends keyof TDefinition, T16 extends keyof TDefinition, T17 extends keyof TDefinition, T18 extends keyof TDefinition, T19 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13, property14: T14, property15: T15, property16: T16, property17: T17, property18: T18, property19: T19): LoadableStratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16 | T17 | T18 | T19>>;
// export default function defineLoadableStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition, T14 extends keyof TDefinition, T15 extends keyof TDefinition, T16 extends keyof TDefinition, T17 extends keyof TDefinition, T18 extends keyof TDefinition, T19 extends keyof TDefinition, T20 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13, property14: T14, property15: T15, property16: T16, property17: T17, property18: T18, property19: T19, property20: T20): LoadableStratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16 | T17 | T18 | T19 | T20>>;
// export default function defineLoadableStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition, T14 extends keyof TDefinition, T15 extends keyof TDefinition, T16 extends keyof TDefinition, T17 extends keyof TDefinition, T18 extends keyof TDefinition, T19 extends keyof TDefinition, T20 extends keyof TDefinition, T21 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13, property14: T14, property15: T15, property16: T16, property17: T17, property18: T18, property19: T19, property20: T20, property21: T21): LoadableStratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16 | T17 | T18 | T19 | T20 | T21>>;
// export default function defineLoadableStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition, T14 extends keyof TDefinition, T15 extends keyof TDefinition, T16 extends keyof TDefinition, T17 extends keyof TDefinition, T18 extends keyof TDefinition, T19 extends keyof TDefinition, T20 extends keyof TDefinition, T21 extends keyof TDefinition, T22 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13, property14: T14, property15: T15, property16: T16, property17: T17, property18: T18, property19: T19, property20: T20, property21: T21, property22: T22): LoadableStratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16 | T17 | T18 | T19 | T20 | T21 | T22>>;
// export default function defineLoadableStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition, T14 extends keyof TDefinition, T15 extends keyof TDefinition, T16 extends keyof TDefinition, T17 extends keyof TDefinition, T18 extends keyof TDefinition, T19 extends keyof TDefinition, T20 extends keyof TDefinition, T21 extends keyof TDefinition, T22 extends keyof TDefinition, T23 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13, property14: T14, property15: T15, property16: T16, property17: T17, property18: T18, property19: T19, property20: T20, property21: T21, property22: T22, property23: T23): LoadableStratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16 | T17 | T18 | T19 | T20 | T21 | T22 | T23>>;
// export default function defineLoadableStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition, T14 extends keyof TDefinition, T15 extends keyof TDefinition, T16 extends keyof TDefinition, T17 extends keyof TDefinition, T18 extends keyof TDefinition, T19 extends keyof TDefinition, T20 extends keyof TDefinition, T21 extends keyof TDefinition, T22 extends keyof TDefinition, T23 extends keyof TDefinition, T24 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13, property14: T14, property15: T15, property16: T16, property17: T17, property18: T18, property19: T19, property20: T20, property21: T21, property22: T22, property23: T23, property24: T24): LoadableStratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16 | T17 | T18 | T19 | T20 | T21 | T22 | T23 | T24>>;
// export default function defineLoadableStratum<TDefinition, T1 extends keyof TDefinition, T2 extends keyof TDefinition, T3 extends keyof TDefinition, T4 extends keyof TDefinition, T5 extends keyof TDefinition, T6 extends keyof TDefinition, T7 extends keyof TDefinition, T8 extends keyof TDefinition, T9 extends keyof TDefinition, T10 extends keyof TDefinition, T11 extends keyof TDefinition, T12 extends keyof TDefinition, T13 extends keyof TDefinition, T14 extends keyof TDefinition, T15 extends keyof TDefinition, T16 extends keyof TDefinition, T17 extends keyof TDefinition, T18 extends keyof TDefinition, T19 extends keyof TDefinition, T20 extends keyof TDefinition, T21 extends keyof TDefinition, T22 extends keyof TDefinition, T23 extends keyof TDefinition, T24 extends keyof TDefinition, T25 extends keyof TDefinition>(definition: DefinitionConstructor<TDefinition>, property1: T1, property2: T2, property3: T3, property4: T4, property5: T5, property6: T6, property7: T7, property8: T8, property9: T9, property10: T10, property11: T11, property12: T12, property13: T13, property14: T14, property15: T15, property16: T16, property17: T17, property18: T18, property19: T19, property20: T20, property21: T21, property22: T22, property23: T23, property24: T24, property25: T25): LoadableStratumConstructor<Pick<TDefinition, T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | T13 | T14 | T15 | T16 | T17 | T18 | T19 | T20 | T21 | T22 | T23 | T24 | T25>>;
export default function defineLoadableStratum<TDefinition, TValue>(definition: DefinitionConstructor<TDefinition>, value: Constructor<TValue>, ...properties: string[]): LoadableStratumConstructor<any> {
    if (!properties || properties.length === 0) {
        properties = Object.keys(definition.metadata);
    }

    //>>includeStart('debug', pragmas.debug);
    properties.forEach(property => {
        if (!(property in definition.metadata)) {
            throw new DeveloperError(`Property "${property}" does not exist or is not decorated as a ModelProperty.`);
        }
    })
    //>>includeEnd('debug');

    const valuesTemplate: any = {};
    properties.forEach(property => {
        valuesTemplate[property] = undefined;
    });

    class LoadableSubset {
        static TLoadValue: TValue;
        static TInstance: LoadableStratumInstance<any>;

        // We manually use atoms to avoid MobX complaining about a
        // computed modifying an observable.
        private _isLoadingAtom = createAtom('isLoadingAtom', () => {}, () => {});
        private _isLoading = false;

        private _loadPromiseAtom = createAtom('loadPromise', () => {}, () => {});
        private _loadPromise: Promise<void> = undefined;

        constructor(private readonly loadFunction: (LoadableSubset) => Promise<void>) {
            //>>includeStart('debug', pragmas.debug);
            onBecomeUnobserved(this, '_privateValues', () => {
                console.info('A loaded subset is no longer being observed by anyone, which means that the previously-loaded values have been lost.');
            });
            //>>includeEnd('debug');
        }

        @computed({
            requiresReaction: true
        })
        private get _privateValues() {
            const newValues = observable(value ? new value() : valuesTemplate);

            runInAction(() => {
                if (!this._isLoading) {
                    this._isLoading = true;
                    this._isLoadingAtom.reportChanged();
                }
            });

            // TODO: it would be nice if we could cancel a previous load that
            // was started but not yet completed. But to do that we'll need
            // cancelable requests and (ideally) cancelable promises.
            this._loadPromise = this.loadFunction(newValues).then(() => {
                console.log('loadPromise: resolve');
                runInAction(() => {
                    if (this._isLoading) {
                        this._isLoading = false;
                        this._isLoadingAtom.reportChanged();
                    }
                });
            }).catch(e => {
                console.log('loadPromise: reject');
                runInAction(() => {
                    if (this._isLoading) {
                        this._isLoading = false;
                        this._isLoadingAtom.reportChanged();
                    }
                });
                throw e;
            });

            runInAction(() => {
                this._loadPromiseAtom.reportChanged();
            });

            return newValues;
        }

        /**
         * Gets a promise that will resolve when the load process completes, or reject if there
         * is an error during load. Accessing this property will _not_ automatically trigger loading.
         */
        get loadPromise(): Promise<void> {
            this._loadPromiseAtom.reportObserved();
            return this._loadPromise;
        }

        /**
         * Gets a value indicating whether loading is in progress. Accessing this property will
         * _not_ automatically trigger loading.
         */
        get isLoading(): boolean {
            this._isLoadingAtom.reportObserved();
            return this._isLoading;
        }

        loadIfNeeded() {
            const values = this._privateValues; // to trigger load if needed
            return this.loadPromise;
        }
    }

    properties.forEach(property => {
        Object.defineProperty(LoadableSubset.prototype, property, {
            get: function() {
                return this._privateValues[property];
            },
            enumerable: true,
            configurable: true
        });
    });

    const decorators: any = {};
    properties.forEach(property => {
        decorators[property] = computed;
    });

    decorate(LoadableSubset, decorators);

    return LoadableSubset;
}
