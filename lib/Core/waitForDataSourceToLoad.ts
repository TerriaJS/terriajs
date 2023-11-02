import DataSource from "terriajs-cesium/Source/DataSources/DataSource";

/**
 * Returns a promise that resolves when the given dataSource finishes loading
 */
export default function waitForDataSourceToLoad(
  dataSource: DataSource
): Promise<void> {
  if (dataSource.isLoading && dataSource.loadingEvent) {
    return new Promise((resolve) => {
      const removeEventListener = dataSource.loadingEvent.addEventListener(
        () => {
          removeEventListener();
          resolve();
        }
      );
    });
  }
  return Promise.resolve();
}
