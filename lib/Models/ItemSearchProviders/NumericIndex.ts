import joinUrl from "./joinUrl";
import loadCsv from "./loadCsv";
import binarySearch from "terriajs-cesium/Source/Core/binarySearch";

export type NumericRange = { min: number; max: number };

// Start and end numbers
type NumericSearchQuery = {
  start: number;
  end: number;
};

export default class NumericIndex {
  readonly type = "numeric";

  private idValuePairs?: { dataRowId: number; value: number }[];

  constructor(readonly url: string, readonly range: NumericRange) {}

  async load(
    indexRootUrl: string,
    _valueHint: NumericSearchQuery
  ): Promise<void> {
    if (this.idValuePairs) return;
    const indexUrl = joinUrl(indexRootUrl, this.url);
    this.idValuePairs = await loadCsv(indexUrl, {
      dynamicTyping: true,
      header: true
    });
  }

  search(value: NumericSearchQuery): Set<number> {
    if (!this.idValuePairs) throw new Error(`Index not loaded`);
    const range = this.range;
    const idValuePairs = this.idValuePairs;
    const startValue = value.start === undefined ? range.min : value.start;
    const endValue = value.end === undefined ? range.max : value.end;
    const i = binarySearch(
      idValuePairs,
      { value: startValue },
      (a, b) => a.value - b.value
    );
    const j = binarySearch(
      idValuePairs,
      { value: endValue },
      (a, b) => a.value - b.value
    );
    const startIndex = i < 0 ? ~i : i;
    const endIndex = j < 0 ? ~j : j;
    const matchingIds = idValuePairs
      .slice(startIndex, endIndex + 1)
      .map(({ dataRowId }) => dataRowId);
    return new Set(matchingIds);
  }
}
