import flatten from "lodash-es/flatten";
import MiniSearch from "minisearch";
import binarySearch from "terriajs-cesium/Source/Core/binarySearch";
import JsonValue, {
  assertNumber,
  assertObject,
  assertString
} from "../../Core/Json";

export type IndexRoot = {
  dataUrl: string;
  idProperty: string;
  indexes: Map<string, Index>;
};

export type Index = NumericIndex | EnumIndex | TextIndex;

export type IndexType = Index["type"];

export type ID = number;

export type SearchFn = (value: any) => Set<ID>;

type NumericIndex = {
  type: "numeric";
  name?: string;
  url: string;
  range: Range;
  idValuePairs?: Promise<[ID, number][]>;
};

type EnumIndex = {
  type: "enum";
  name?: string;
  values: Map<string, EnumValue>;
};

type EnumValue = {
  count: number;
  url: string;
  ids?: Promise<ID[]>;
};

type TextIndex = {
  type: "text";
  name?: string;
  url: string;
  miniSearchIndex?: Promise<MiniSearch>;
};

export type Range = { min: number; max: number };

const indexParsers: Record<IndexType, (json: any) => Index> = {
  numeric: parseNumericIndex,
  enum: parseEnumIndex,
  text: parseTextIndex
};

const indexTypes = Object.keys(indexParsers);

export function parseIndexRoot(json: JsonValue): IndexRoot {
  assertObject(json, "IndexRoot");
  assertString(json.dataUrl, "dataUrl");
  assertString(json.idProperty, "idProperty");
  assertObject(json.indexes, "indexes");
  const indexes = new Map(
    Object.entries(json.indexes).map(([property, index]) => [
      property,
      parseIndex(index)
    ])
  );
  return {
    dataUrl: json.dataUrl,
    idProperty: json.idProperty,
    indexes
  };
}

function parseIndex(json: JsonValue): Index {
  assertObject(json, "Index");
  assertString(json.type, "type");
  const parser = indexParsers[json.type as IndexType];
  if (parser) return parser(json);
  throw new Error(
    `Expected index type to be ${indexTypes.join("|")}, got ${json.type}`
  );
}

function parseBaseIndex<T extends Index>(
  json: JsonValue
): { type: T["type"]; name?: string } {
  assertObject(json, "Index");
  if (!indexTypes.includes(json.type as any)) {
    throw new Error(
      `Expected type to be ${indexTypes.join("|")}, got ${json.type}`
    );
  }
  if (json.name !== undefined) assertString(json.name, "name");
  const type = json.type as IndexType;
  return {
    type,
    name: json.name
  };
}

function parseNumericIndex(json: JsonValue): NumericIndex {
  assertObject(json, "NumericIndex");
  const base = parseBaseIndex<NumericIndex>(json);
  assertObject(json.range, "range");
  assertNumber(json.range.max, "range.max");
  assertNumber(json.range.min, "range.min");
  assertString(json.url, "url");
  return {
    ...base,
    range: { min: json.range.min, max: json.range.max },
    url: json.url
  };
}

function parseEnumIndex(json: JsonValue): EnumIndex {
  assertObject(json, "EnumIndex");
  const base = parseBaseIndex<EnumIndex>(json);
  assertObject(json.values);
  const values = new Map(
    Object.entries(json.values).map(([id, value]) => [
      id,
      parseEnumValue(value)
    ])
  );
  return {
    ...base,
    values
  };
}

function parseEnumValue(json: JsonValue): EnumValue {
  assertObject(json, "EnumValue");
  assertNumber(json.count);
  assertString(json.url);
  return {
    count: json.count,
    url: json.url
  };
}

function parseTextIndex(json: JsonValue): TextIndex {
  assertObject(json, "EnumIndex");
  const base = parseBaseIndex<TextIndex>(json);
  assertString(json.url);
  return {
    ...base,
    url: json.url
  };
}

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
        [null, startValue],
        (a, b) => a[1] - b[1]
      );
      const j = binarySearch(
        idValuePairs,
        [null, endValue],
        (a, b) => a[1] - b[1]
      );
      const startIndex = i < 0 ? ~i : i;
      const endIndex = j < 0 ? ~j : j;
      const matchingIds = idValuePairs
        .slice(startIndex, endIndex + 1)
        .map(([id, _]) => id);
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
      const enumIndex = index.values.get(enumValue);
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
