export default function isDefined<T>(value?: T): value is T {
  return value !== undefined;
}
