import StratumFromTraits from "../../lib/Models/Definition/StratumFromTraits";
import TraitsForTesting from "./TraitsForTesting";
import { expectFalse, expectTrue } from "./TypeChecks";
import {
  Equals,
  IsWritable,
  AllowsUndefined,
  IsWritableArray
} from "../../lib/Core/TypeConditionals";
import { JsonObject } from "../../lib/Core/Json";

type Stratum = StratumFromTraits<TraitsForTesting>;

const stratum: Stratum = <any>{};

// Simple properties allow undefined, whether they have a default or not.
expectTrue<Equals<typeof stratum.withDefault, number | undefined>>();
expectTrue<Equals<typeof stratum.withoutDefault, number | undefined>>();
expectTrue<Equals<typeof stratum.unknownObject, JsonObject | undefined>>();
expectTrue<
  Equals<typeof stratum.unknownObjectWithDefault, JsonObject | undefined>
>();
expectTrue<Equals<typeof stratum.withNull, string | null | undefined>>();

// All properties can be modified.
expectTrue<IsWritable<typeof stratum, "withDefault">>();
expectTrue<IsWritable<typeof stratum, "withoutDefault">>();
expectTrue<IsWritable<typeof stratum, "unknownObject">>();
expectTrue<IsWritable<typeof stratum, "unknownObjectWithDefault">>();
expectTrue<IsWritable<typeof stratum, "withNull">>();

// Properties that are nested traits allow undefined.
expectTrue<AllowsUndefined<typeof stratum.nestedWithDefault>>();
expectTrue<AllowsUndefined<typeof stratum.nestedWithoutDefault>>();

const nested = stratum.nestedWithDefault;
if (nested) {
  // All nested properties allow undefined.
  expectTrue<Equals<typeof nested.withDefault, number | undefined>>();
  expectTrue<Equals<typeof nested.withoutDefault, number | undefined>>();
  expectTrue<Equals<typeof nested.unknownObject, JsonObject | undefined>>();
  expectTrue<
    Equals<typeof nested.unknownObjectWithDefault, JsonObject | undefined>
  >();
  expectTrue<Equals<typeof nested.withNull, string | null | undefined>>();

  // All nested properties can be modified.
  expectTrue<IsWritable<typeof nested, "withDefault">>();
  expectTrue<IsWritable<typeof nested, "withoutDefault">>();
  expectTrue<IsWritable<typeof nested, "unknownObject">>();
  expectTrue<IsWritable<typeof nested, "unknownObjectWithDefault">>();
  expectTrue<IsWritable<typeof nested, "withNull">>();
}

// Properties that are arrays of traits allow undefined.
expectTrue<AllowsUndefined<typeof stratum.nestedArrayWithDefault>>();
expectTrue<AllowsUndefined<typeof stratum.nestedArrayWithoutDefault>>();

// Array traits are writable.
expectTrue<
  IsWritableArray<NonNullable<typeof stratum.nestedArrayWithDefault>>
>();
expectTrue<
  IsWritableArray<NonNullable<typeof stratum.nestedArrayWithoutDefault>>
>();

const array = stratum.nestedArrayWithDefault;
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

  // Properties in traits in arrays can be modified.
  expectTrue<IsWritable<typeof first, "withDefault">>();
  expectTrue<IsWritable<typeof first, "withoutDefault">>();
  expectTrue<IsWritable<typeof first, "unknownObject">>();
  expectTrue<IsWritable<typeof first, "unknownObjectWithDefault">>();
  expectTrue<IsWritable<typeof first, "withNull">>();
}
