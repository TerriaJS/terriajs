import flatten from "lodash-es/flatten";
import binarySearch from "terriajs-cesium/Source/Core/binarySearch";
import { EnumIndex, NumericIndex, SearchFn, TextIndex } from "./Index";

export function numericIndexSearchFunction(
  index: NumericIndex
): Promise<SearchFn> {
  if (!index.idValuePairs) throw new Error(`Index not loaded`);
  return index.idValuePairs.then(
    idValuePairs => (value: { start?: number; end?: number }) => {
      const startValue =
        value.start === undefined ? index.range.min : value.start;
      const endValue = value.end === undefined ? index.range.max : value.end;
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
        .map(({ dataRowIndex }) => dataRowIndex);
      return new Set(matchingIds);
    }
  );
}

export async function enumIndexSearchFunction(
  index: EnumIndex,
  enumValuesIds: string[]
): Promise<SearchFn> {
  const idSets = await Promise.all(
    enumValuesIds.map(async enumValue => {
      const enumIndex = index.values[enumValue];
      if (!enumIndex) throw new Error(`Not an enum value: ${enumValue}`);
      if (!enumIndex.ids)
        throw new Error(`Index for enum value ${enumValue} is not loaded`);
      const ids = await enumIndex.ids;
      return ids;
    })
  );
  // Union of all given value ids
  const ids = new Set(flatten(idSets));
  return () => ids;
}

export async function textIndexSearchFunction(
  index: TextIndex
): Promise<SearchFn> {
  if (!index.miniSearchIndex) throw new Error(`Index not loaded`);
  return index.miniSearchIndex.then(miniSearchIndex => (value: string) => {
    const results = miniSearchIndex.search(value);
    const ids = new Set(results.map(r => r.id));
    return ids;
  });
}
