/**
 * This is almost like `Partial<T>`, except it uses `| undefined` instead of
 * `[P in keyof T]?`, which is subtly different. `OrUndefined<T>` requires that the
 * each property exist but its value may be undefined, while `Partial<T>` does
 * not require that the property exist at all.
 */
type OrUndefined<T> = {
    [P in keyof T]: T[P] | undefined;
}

export default OrUndefined;
