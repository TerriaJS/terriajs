import MiniSearch from "minisearch";
import JsonValue, {
  assertNumber,
  assertObject,
  assertString
} from "../../Core/Json";

export type IndexRoot = {
  dataUrl: string;
  idProperty: string;
  indexes: Record<string, Index>;
};

export type Index = NumericIndex | EnumIndex | TextIndex;

export type IndexType = Index["type"];

export type ID = number;

export type SearchFn = (value: any) => Set<ID>;

export type NumericIndex = {
  type: "numeric";
  url: string;
  range: Range;
  idValuePairs?: Promise<{ dataRowIndex: number; value: number }[]>;
};

export type EnumIndex = {
  type: "enum";
  values: Record<string, EnumValue>;
};

export type EnumValue = {
  count: number;
  url: string;
  ids?: Promise<ID[]>;
};

export type TextIndex = {
  type: "text";
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
  const indexes: Record<string, Index> = Object.entries(json.indexes).reduce(
    (indexes: Record<string, Index>, [property, index]) => {
      indexes[property] = parseIndex(index);
      return indexes;
    },
    {}
  );
  return {
    dataUrl: json.dataUrl,
    idProperty: json.idProperty,
    indexes
  };
}

export function parseIndexType(json: JsonValue): IndexType {
  assertString(json, "IndexType");
  if (indexTypes.includes(json)) return json as IndexType;
  throw new Error(
    `Expected index type to be ${indexTypes.join("|")}, got ${json}`
  );
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

function parseBaseIndex<T extends Index>(json: JsonValue): { type: T["type"] } {
  assertObject(json, "Index");
  if (!indexTypes.includes(json.type as any)) {
    throw new Error(
      `Expected type to be ${indexTypes.join("|")}, got ${json.type}`
    );
  }
  const type = json.type as IndexType;
  return {
    type
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
  const values: Record<string, EnumValue> = Object.entries(json.values).reduce(
    (values: Record<string, EnumValue>, [id, value]) => {
      values[id] = parseEnumValue(value);
      return values;
    },
    {}
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
