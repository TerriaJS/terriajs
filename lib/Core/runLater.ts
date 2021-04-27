import defaultValue from "terriajs-cesium/Source/Core/defaultValue";

export default function runLater<T>(
  functionToRunLater: () => T,
  milliseconds?: number
) {
  milliseconds = defaultValue(milliseconds, 0);

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
