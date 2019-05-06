import Class from "./Class";

/**
 * Determines whether a given instance is an instance of a given class.
 * This is identical to the `instanceof` operator except that it can be used with
 * a generic parameter.
 *
 * @param type The type to check against.
 * @param instance The instance to check.
 * @returns true if `instance` is an instance of `type`.
 * @example
 * const isCatalogGroup = instanceOf(CatalogGroup, catalogMember);
 */
export default function instanceOf<T>(
  type: Class<T>,
  instance: any
): instance is T {
  return instance instanceof <any>type;
}
