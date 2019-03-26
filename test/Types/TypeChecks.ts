type IfEquals<X, Y, True=X, False=never> =
    (<T>() => T extends X ? 1 : 2) extends
    (<T>() => T extends Y ? 1 : 2) ? True : False;

type WritableKeys<T> = {
    [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P>
}[keyof T];

type ReadonlyKeys<T> = {
    [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, never, P>
}[keyof T];
    
export type Equals<A, B> = IfEquals<A, B, true, false>;
export type IsWritableArray<T> = T extends Array<infer U> ? true : false;
export type IsReadonlyArray<T> = IsWritableArray<T> extends true ? false : T extends ReadonlyArray<infer U> ? true : false;
export type IsReadonly<T, K extends keyof T> = K extends ReadonlyKeys<T> ? true : false;
export type IsWritable<T, K extends keyof T> = K extends WritableKeys<T> ? true : false;

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
