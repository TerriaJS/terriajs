import joinUrl from "./joinUrl";
import loadCsv from "./loadCsv";

// IDs of enum to search
type EnumSearchQuery = string[];

export default class EnumIndex {
  readonly type = "enum";

  constructor(readonly values: Record<string, EnumValue>) {}

  async load(indexRootUrl: string, searchHint: EnumSearchQuery): Promise<void> {
    const enumValueIds = searchHint;
    const promises = enumValueIds.map(async valueId => {
      const value = this.values[valueId];
      if (value.dataRowIds) return Promise.resolve();
      value.dataRowIds = await loadCsv(joinUrl(indexRootUrl, value.url), {
        dynamicTyping: true,
        header: true
      }).then(rows => rows.map(({ dataRowId }) => dataRowId));
    });
    await Promise.all(promises);
  }

  search(enumValueIds: EnumSearchQuery): Set<number> {
    const ids = flatten(
      enumValueIds.map(valueId => {
        const value = this.values[valueId];
        if (!value) throw new Error(`Not an enum value: ${valueId}`);
        if (!value.dataRowIds)
          throw new Error(`Index for enum value ${valueId} is not loaded`);
        return value.dataRowIds;
      })
    );
    return new Set(ids);
  }
}

export type EnumValue = {
  count: number;
  url: string;
  dataRowIds?: number[];
};

function flatten<T>(array: T[][]): T[] {
  const flattened = array.reduce((acc, a) => acc.concat(a), []);
  return flattened;
}
