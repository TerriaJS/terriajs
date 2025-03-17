import { JsonObject } from "../../lib/Core/Json";
import {
  AllowsUndefined,
  Equals,
  IsWritable,
  IsWritableArray
} from "../../lib/Core/TypeConditionals";
import ModelPropertiesFromTraits from "../../lib/Models/Definition/ModelPropertiesFromTraits";
import TraitsForTesting from "./TraitsForTesting";
import { expectFalse, expectTrue } from "./TypeChecks";

type ModelProperties = ModelPropertiesFromTraits<TraitsForTesting>;

const modelProperties: ModelProperties = {} as any;

// Simple properties allow undefined only if they do not have a default.
expectTrue<Equals<typeof modelProperties.withDefault, number>>();
expectTrue<Equals<typeof modelProperties.withoutDefault, number | undefined>>();
expectTrue<Equals<typeof modelProperties.someBool, boolean | undefined>>();
expectTrue<
  Equals<typeof modelProperties.unknownObject, JsonObject | undefined>
>();
expectTrue<
  Equals<typeof modelProperties.unknownObjectWithDefault, JsonObject>
>();
expectTrue<
  Equals<typeof modelProperties.withNull, string | null | undefined>
>();

// No properties can be modified.
expectFalse<IsWritable<typeof modelProperties, "withDefault">>();
expectFalse<IsWritable<typeof modelProperties, "withoutDefault">>();

// Properties that are nested traits do not allow undefined even if they do not have a default.
expectFalse<AllowsUndefined<typeof modelProperties.nestedWithDefault>>();
expectFalse<AllowsUndefined<typeof modelProperties.nestedWithoutDefault>>();

const _nested = modelProperties.nestedWithDefault;

// Nested properties allow undefined only if they do not have a default.
expectTrue<Equals<typeof _nested.withDefault, number>>();
expectTrue<Equals<typeof _nested.withoutDefault, number | undefined>>();
expectTrue<Equals<typeof _nested.unknownObject, JsonObject | undefined>>();
expectTrue<Equals<typeof _nested.unknownObjectWithDefault, JsonObject>>();
expectTrue<Equals<typeof _nested.withNull, string | null | undefined>>();

// Nested properties may not be modified.
expectFalse<IsWritable<typeof _nested, "withDefault">>();
expectFalse<IsWritable<typeof _nested, "withoutDefault">>();

// Properties that are arrays of traits allow undefined only if they do not have a default.
expectFalse<AllowsUndefined<typeof modelProperties.nestedArrayWithDefault>>();
expectFalse<
  AllowsUndefined<typeof modelProperties.nestedArrayWithoutDefault>
>();

// Array traits are not writable.
expectFalse<
  IsWritableArray<NonNullable<typeof modelProperties.nestedArrayWithDefault>>
>();
expectFalse<
  IsWritableArray<NonNullable<typeof modelProperties.nestedArrayWithoutDefault>>
>();

const array = modelProperties.nestedArrayWithDefault;
if (array) {
  const _first = array[0];

  // Arrays may not _contain_ undefineds.
  expectFalse<AllowsUndefined<typeof _first>>();

  // Properties in traits in arrays allow undefined only if they do not have a default.
  expectTrue<Equals<typeof _first.withDefault, number>>();
  expectTrue<Equals<typeof _first.withoutDefault, number | undefined>>();
  expectTrue<Equals<typeof _first.unknownObject, JsonObject | undefined>>();
  expectTrue<Equals<typeof _first.unknownObjectWithDefault, JsonObject>>();
  expectTrue<Equals<typeof _first.withNull, string | null | undefined>>();

  // Properties in traits in arrays can not be modified.
  expectFalse<IsWritable<typeof _first, "withDefault">>();
  expectFalse<IsWritable<typeof _first, "withoutDefault">>();
}
