import { AllowsUndefined, Equals, IsWritable, IsWritableArray } from '../../lib/Core/TypeConditionals';
import ModelPropertiesFromTraits from '../../lib/Models/ModelPropertiesFromTraits';
import TraitsForTesting, { NestedTraits } from './TraitsForTesting';
import { expectFalse, expectTrue } from './TypeChecks';
import { IsValidSimpleTraitType } from '../../lib/Traits/ModelTraits';

type ModelProperties = ModelPropertiesFromTraits<TraitsForTesting>;

const modelProperties: ModelProperties = <any>{};

// Simple properties allow undefined only if they do not have a default.
expectTrue<Equals<typeof modelProperties.withDefault, number>>();
expectTrue<Equals<typeof modelProperties.withoutDefault, number | undefined>>();
expectTrue<Equals<typeof modelProperties.someBool, boolean | undefined>>();
expectTrue<Equals<typeof modelProperties.unknownObject, object | undefined>>();
expectTrue<Equals<typeof modelProperties.unknownObjectWithDefault, object>>();
expectTrue<Equals<typeof modelProperties.withNull, string | null | undefined>>();
expectTrue<Equals<typeof modelProperties.nestedNullable, ModelPropertiesFromTraits<NestedTraits> | null | undefined>>();

// No properties can be modified.
expectFalse<IsWritable<typeof modelProperties, 'withDefault'>>();
expectFalse<IsWritable<typeof modelProperties, 'withoutDefault'>>();

// Properties that are nested traits allow undefined only if they do not have a default.
expectFalse<AllowsUndefined<typeof modelProperties.nestedWithDefault>>();
expectTrue<AllowsUndefined<typeof modelProperties.nestedWithoutDefault>>();

const nested = modelProperties.nestedWithDefault;
if (nested) {
    // Nested properties allow undefined only if they do not have a default.
    expectTrue<Equals<typeof nested.withDefault, number>>();
    expectTrue<Equals<typeof nested.withoutDefault, number | undefined>>();
    expectTrue<Equals<typeof nested.unknownObject, object | undefined>>();
    expectTrue<Equals<typeof nested.unknownObjectWithDefault, object>>();
    expectTrue<Equals<typeof nested.withNull, string | null | undefined>>();

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
    expectTrue<Equals<typeof first.unknownObject, object | undefined>>();
    expectTrue<Equals<typeof first.unknownObjectWithDefault, object>>();
    expectTrue<Equals<typeof first.withNull, string | null | undefined>>();

    // Properties in traits in arrays can not be modified.
    expectFalse<IsWritable<typeof first, 'withDefault'>>();
    expectFalse<IsWritable<typeof first, 'withoutDefault'>>();
}
