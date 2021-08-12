export default function filterOutUndefined<T>(
  array: Array<T | undefined>
): Array<T> {
  return <Array<T>>array.filter(x => x !== undefined);
}
