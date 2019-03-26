import AllowsUndefined from '../../lib/Core/AllowsUndefined';
import ModelPropertiesFromTraits from '../../lib/Models/ModelPropertiesFromTraits';
import TraitsForTesting from './TraitsForTesting';
import { Equals, expectFalse, expectTrue, IsWritable, IsWritableArray } from './TypeChecks';

type ModelProperties = ModelPropertiesFromTraits<TraitsForTesting>;

const modelProperties: ModelProperties = <any>{};

// Simple properties allow undefined only if they do not have a default.
expectTrue<Equals<typeof modelProperties.withDefault, number>>();
expectTrue<Equals<typeof modelProperties.withoutDefault, number | undefined>>();

// No properties can be modified.
expectFalse<IsWritable<typeof modelProperties, 'withDefault'>>();
expectFalse<IsWritable<typeof modelProperties, 'withoutDefault'>>();

// Properties that are nested traits allow undefined only if they do not have a default.
expectFalse<AllowsUndefined<typeof modelProperties.nestedWithDefault>>();
expectTrue<AllowsUndefined<typeof modelProperties.nestedWithoutDefault>>();

const nested = modelProperties.nestedWithDefault;
if (nested) {
    // Nested properties allow undefined only if they do not have a default.
    expectFalse<Equals<typeof nested.withDefault, number | undefined>>();
    expectTrue<Equals<typeof nested.withoutDefault, number | undefined>>();

    // Nested properties may not be modified.
    expectFalse<IsWritable<typeof nested, 'withDefault'>>();
    expectFalse<IsWritable<typeof nested, 'withoutDefault'>>();
}

// Properties that are arrays of traits allow undefined only if they do not have a default.
expectFalse<AllowsUndefined<typeof modelProperties.nestedArrayWithDefault>>();
expectTrue<AllowsUndefined<typeof modelProperties.nestedArrayWithoutDefault>>();

// Array traits are not writable.
expectFalse<IsWritableArray<NonNullable<typeof modelProperties.nestedArrayWithDefault>>>();
expectFalse<IsWritableArray<NonNullable<typeof modelProperties.nestedArrayWithoutDefault>>>();

const array = modelProperties.nestedArrayWithDefault;
if (array) {
    const first = array[0];

    // Arrays may not _contain_ undefineds.
    expectFalse<AllowsUndefined<typeof first>>();

    // Properties in traits in arrays allow undefined only if they do not have a default.
    expectTrue<Equals<typeof first.withDefault, number>>();
    expectTrue<Equals<typeof first.withoutDefault, number | undefined>>();

    // Properties in traits in arrays can not be modified.
    expectFalse<IsWritable<typeof first, 'withDefault'>>();
    expectFalse<IsWritable<typeof first, 'withoutDefault'>>();
}
