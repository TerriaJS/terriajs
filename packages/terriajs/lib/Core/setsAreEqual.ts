export function setsAreEqual<T>(left: Set<T> | T[], right: Set<T> | T[]) {
  if (Array.isArray(left)) left = new Set(left);

  if (Array.isArray(right)) right = new Set(right);

  if (left === right) {
    return true;
  }

  if (left.size !== right.size) {
    return false;
  }

  const union = new Set([...left, ...right]);

  return union.size === left.size && union.size === right.size;
}
