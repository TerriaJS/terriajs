import {
  Equals,
  IsWritableArray,
  IsReadonlyArray,
  IsWritable,
  IsReadonly
} from "../../lib/Core/TypeConditionals";

// Based on the approach described here: https://stackoverflow.com/a/49579497
export function expectTrue<T extends true>() {}
export function expectFalse<T extends false>() {}

expectTrue<Equals<number, number>>();
expectTrue<Equals<number | undefined, number | undefined>>();
expectTrue<Equals<number | string, number | string>>();

expectFalse<Equals<number, string>>();
expectFalse<Equals<number | undefined, number>>();
expectFalse<Equals<number, number | undefined>>();
expectFalse<Equals<number | string, number>>();
expectFalse<Equals<number, number | string>>();

expectTrue<IsWritableArray<number[]>>();
expectFalse<IsReadonlyArray<number[]>>();
expectTrue<IsReadonlyArray<ReadonlyArray<number>>>();
expectFalse<IsWritableArray<ReadonlyArray<number>>>();

expectTrue<IsWritable<{ foo: number }, "foo">>();
expectFalse<IsWritable<{ readonly foo: number }, "foo">>();
expectTrue<IsReadonly<{ readonly foo: number }, "foo">>();
expectFalse<IsReadonly<{ foo: number }, "foo">>();
