import { JsonObject } from "../../lib/Core/Json";
import {
  AllowsUndefined,
  Equals,
  IsWritable,
  IsWritableArray
} from "../../lib/Core/TypeConditionals";
import FlattenedFromTraits from "../../lib/Models/Definition/FlattenedFromTraits";
import TraitsForTesting, { NestedTraits } from "./TraitsForTesting";
import { expectFalse, expectTrue } from "./TypeChecks";

type Flattened = FlattenedFromTraits<TraitsForTesting>;
const flattened: Flattened = <any>{};

// Simple properties allow undefined, whether they have a default or not.
expectTrue<Equals<typeof flattened.withDefault, number | undefined>>();
expectTrue<Equals<typeof flattened.withoutDefault, number | undefined>>();
expectTrue<Equals<typeof flattened.unknownObject, JsonObject | undefined>>();
expectTrue<
  Equals<typeof flattened.unknownObjectWithDefault, JsonObject | undefined>
>();
expectTrue<Equals<typeof flattened.withNull, string | null | undefined>>();

// Properties may not be modified.
expectFalse<IsWritable<typeof flattened, "withDefault">>();
expectFalse<IsWritable<typeof flattened, "withoutDefault">>();

// Properties that are nested traits allow undefined.
expectTrue<AllowsUndefined<typeof flattened.nestedWithDefault>>();
expectTrue<AllowsUndefined<typeof flattened.nestedWithoutDefault>>();

const nested = flattened.nestedWithDefault;
if (nested) {
  // All nested properties allow undefined.
  expectTrue<Equals<typeof nested.withDefault, number | undefined>>();
  expectTrue<Equals<typeof nested.withoutDefault, number | undefined>>();
  expectTrue<Equals<typeof nested.unknownObject, JsonObject | undefined>>();
  expectTrue<
    Equals<typeof nested.unknownObjectWithDefault, JsonObject | undefined>
  >();
  expectTrue<Equals<typeof nested.withNull, string | null | undefined>>();

  // All nested properties can _not_ be modified.
  expectFalse<IsWritable<typeof nested, "withDefault">>();
  expectFalse<IsWritable<typeof nested, "withoutDefault">>();
}

// Properties that are arrays of traits allow undefined.
expectTrue<AllowsUndefined<typeof flattened.nestedArrayWithDefault>>();
expectTrue<AllowsUndefined<typeof flattened.nestedArrayWithoutDefault>>();

// Array traits are _not_ writable.
expectFalse<
  IsWritableArray<NonNullable<typeof flattened.nestedArrayWithDefault>>
>();
expectFalse<
  IsWritableArray<NonNullable<typeof flattened.nestedArrayWithoutDefault>>
>();

const array = flattened.nestedArrayWithDefault;
if (array) {
  const first = array[0];

  // Arrays may not _contain_ undefineds.
  expectFalse<AllowsUndefined<typeof first>>();

  // Properties in traits in arrays allow undefined.
  expectTrue<Equals<typeof first.withDefault, number | undefined>>();
  expectTrue<Equals<typeof first.withoutDefault, number | undefined>>();
  expectTrue<Equals<typeof first.unknownObject, JsonObject | undefined>>();
  expectTrue<
    Equals<typeof first.unknownObjectWithDefault, JsonObject | undefined>
  >();
  expectTrue<Equals<typeof first.withNull, string | null | undefined>>();

  // Properties in traits in arrays can _not_ be modified.
  expectFalse<IsWritable<typeof first, "withDefault">>();
  expectFalse<IsWritable<typeof first, "withoutDefault">>();
}
