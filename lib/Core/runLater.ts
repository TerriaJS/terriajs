import defaultValue from "terriajs-cesium/Source/Core/defaultValue";

export default function runLater(
  functionToRunLater: () => any,
  milliseconds?: number
) {
  milliseconds = defaultValue(milliseconds, 0);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(functionToRunLater());
      } catch (e) {
        reject(e);
      }
    }, milliseconds);
  });
}
