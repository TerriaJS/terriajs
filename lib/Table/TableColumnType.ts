enum TableColumnType {
  longitude,
  latitude,
  height,
  time,
  scalar,
  enum,
  region,
  text,
  address
}

export function stringToTableColumnType(s: string): TableColumnType | undefined {
  return TableColumnType[<keyof typeof TableColumnType>s];
}

export default TableColumnType;
