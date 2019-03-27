// Based on the approach described here: https://stackoverflow.com/a/49579497
type IfEquals<X, Y, Then=true, Else=false> =
    (<T>() => T extends X ? 1 : 2) extends
    (<T>() => T extends Y ? 1 : 2) ? Then : Else;

type Writable<T, P extends keyof T = keyof T> = {
    -readonly [K in P]: T[P];
};

type WritableKeys<T> = {
    [P in keyof T]-?: IfEquals<Pick<T, P>, Writable<Pick<T, P>>, P, never>
}[keyof T];

type ReadonlyKeys<T> = {
    [P in keyof T]-?: IfEquals<Pick<T, P>, Writable<Pick<T, P>>, never, P>
}[keyof T];

type And<A, B> = A extends true ? (B extends true ? true : false) : false;
type Not<C> = C extends true ? false : true;

export type Equals<A, B> = IfEquals<A, B>;
export type Extends<A, B> = A extends B ? true : false;
export type IsWritableArray<T> = Extends<T, Array<any>>;
export type IsReadonlyArray<T> = And<Extends<T, ReadonlyArray<any>>, Not<IsWritableArray<T>>>;
export type IsReadonly<T, K extends keyof T> = Extends<K, ReadonlyKeys<T>>;
export type IsWritable<T, K extends keyof T> = Extends<K, WritableKeys<T>>;

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

expectTrue<IsWritable<{ foo: number }, 'foo'>>();
expectFalse<IsWritable<{ readonly foo: number }, 'foo'>>();
expectTrue<IsReadonly<{ readonly foo: number }, 'foo'>>();
expectFalse<IsReadonly<{ foo: number }, 'foo'>>();
