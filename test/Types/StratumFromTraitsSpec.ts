import AllowsUndefined from '../../lib/Core/AllowsUndefined';
import StratumFromTraits from '../../lib/ModelInterfaces/StratumFromTraits';
import TraitsForTesting from './TraitsForTesting';
import { Equals, expectFalse, expectTrue, IsWritableArray, IsWritable } from './TypeChecks';

type Stratum = StratumFromTraits<TraitsForTesting>;

const stratum: Stratum = <any>{};

// Simple properties allow undefined, whether they have a default or not.
expectTrue<Equals<typeof stratum.withDefault, number | undefined>>();
expectTrue<Equals<typeof stratum.withoutDefault, number | undefined>>();

// All properties can be modified.
expectTrue<IsWritable<typeof stratum, 'withDefault'>>();
expectTrue<IsWritable<typeof stratum, 'withoutDefault'>>();

// Properties that are nested traits allow undefined.
expectTrue<AllowsUndefined<typeof stratum.nestedWithDefault>>();
expectTrue<AllowsUndefined<typeof stratum.nestedWithoutDefault>>();

const nested = stratum.nestedWithDefault;
if (nested) {
    // All nested properties allow undefined.
    expectTrue<Equals<typeof nested.withDefault, number | undefined>>();
    expectTrue<Equals<typeof nested.withoutDefault, number | undefined>>();

    // All nested properties can be modified.
    expectTrue<IsWritable<typeof nested, 'withDefault'>>();
    expectTrue<IsWritable<typeof nested, 'withoutDefault'>>();
}

// Properties that are arrays of traits allow undefined.
expectTrue<AllowsUndefined<typeof stratum.nestedArrayWithDefault>>();
expectTrue<AllowsUndefined<typeof stratum.nestedArrayWithoutDefault>>();

// Array traits are writable.
expectTrue<IsWritableArray<NonNullable<typeof stratum.nestedArrayWithDefault>>>();
expectTrue<IsWritableArray<NonNullable<typeof stratum.nestedArrayWithoutDefault>>>();

const array = stratum.nestedArrayWithDefault;
if (array) {
    const first = array[0];

    // Arrays may not _contain_ undefineds.
    expectFalse<AllowsUndefined<typeof first>>();

    // Properties in traits in arrays allow undefined.
    expectTrue<Equals<typeof first.withDefault, number | undefined>>();
    expectTrue<Equals<typeof first.withoutDefault, number | undefined>>();

    // Properties in traits in arrays can be modified.
    expectTrue<IsWritable<typeof first, 'withDefault'>>();
    expectTrue<IsWritable<typeof first, 'withoutDefault'>>();
}
