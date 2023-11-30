import isDefined from "./isDefined";

export default function arraysAreEqual<T>(left: T[], right: T[]) {
  if (left === right) {
    return true;
  }

  if (!isDefined(left) || !isDefined(right) || left.length !== right.length) {
    return false;
  }

  for (var i = 0; i < left.length; ++i) {
    if (left[i] !== right[i]) {
      return false;
    }
  }

  return true;
}
