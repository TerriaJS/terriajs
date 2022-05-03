import { NotUndefined } from "./TypeModifiers";

export default function filterOutUndefined<T>(
  array: Array<T | undefined>
): Array<NotUndefined<T>> {
  return array.filter(x => x !== undefined) as Array<NotUndefined<T>>;
}
