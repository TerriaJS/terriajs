import { If, AllowsUndefined } from "./TypeConditionals";

/**
 * Makes a target type `| undefined` if the source type is `| undefined`.
 * @example
 * type T = ApplyUndefined<number | undefined, string>; // string | undefined
 */
export type ApplyUndefined<TSource, TTarget> = If<AllowsUndefined<TSource>, TTarget | undefined, TTarget>;

/**
 * Removes `| undefined` from the type.
 * @example
 * type T = NotUndefined<number | undefined>; // number
 */
export type NotUndefined<T> = T extends undefined ? never : T;

/**
 * Makes all properties required to be present. Any that were previously optional are
 * allowed to be undefined.
 * @example
 * type T = Complete<{
 *     foo?: number; // becomes `foo: number | undefined`
 * }>;
 */
export type Complete<T> = {
    [P in keyof Required<T>]: Pick<T, P> extends Required<Pick<T, P>> ? T[P] : (T[P] | undefined);
}
