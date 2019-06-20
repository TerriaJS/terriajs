export default function flatMap<T, R>(
  array: ReadonlyArray<T>,
  f: (t: T) => ReadonlyArray<R>
): R[] {
  return ([] as R[]).concat(...array.map(f));
}
