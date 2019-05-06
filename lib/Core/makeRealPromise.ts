import when from "terriajs-cesium/Source/ThirdParty/when";

/**
 * Turns a Cesium when.js promise into a normal native promise.
 * @param promise The Cesium promise.
 * @returns The native promise;
 */
export default function makeRealPromise<T>(
  promise: ReturnType<typeof when>
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    when(promise, resolve, reject);
  });
}
