export default function isReadOnlyArray<T>(
  value?: T | ReadonlyArray<T>
): value is ReadonlyArray<T> {
  return Array.isArray(value);
}
