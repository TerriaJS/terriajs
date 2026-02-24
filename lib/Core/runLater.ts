export default function runLater<T>(
  functionToRunLater: () => T,
  milliseconds?: number
) {
  milliseconds = milliseconds ?? 0;

  return new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(functionToRunLater());
      } catch (e) {
        reject(e);
      }
    }, milliseconds);
  });
}
