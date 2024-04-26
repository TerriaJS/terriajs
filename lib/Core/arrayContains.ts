export default function arrayContains<T>(array: readonly T[], value: T) {
  for (let i = 0; i < array.length; ++i) {
    if (array[i] === value) {
      return true;
    }
  }
  return false;
}
