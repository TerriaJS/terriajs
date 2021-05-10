type JsonValue = boolean | number | string | null | JsonArray | JsonObject;
export interface JsonObject {
  [key: string]: JsonValue;
}
export interface JsonArray extends Array<JsonValue> {}
export default JsonValue;

export function isJsonObject(
  value: JsonValue | undefined
): value is JsonObject {
  return (
    value !== undefined &&
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

export function isJsonBoolean(value: JsonValue | undefined): value is boolean {
  return typeof value === "boolean";
}

export function isJsonNumber(value: JsonValue | undefined): value is number {
  return typeof value === "number";
}

export function isJsonString(value: JsonValue | undefined): value is string {
  return typeof value === "string";
}

export function assertObject(
  value: any,
  name?: string
): asserts value is JsonObject {
  if (isJsonObject(value)) return;
  throwUnexpectedError("JsonObject", typeof value, name);
}

export function assertString(
  value: any,
  name?: string
): asserts value is string {
  if (typeof value === "string") return;
  throwUnexpectedError("string", typeof value, name);
}

export function assertNumber(
  value: any,
  name?: string
): asserts value is number {
  if (typeof value === "number") return;
  throwUnexpectedError("number", typeof value, name);
}

export function assertArray(
  value: any,
  name?: string
): asserts value is Array<any> {
  if (Array.isArray(value)) return;
  throwUnexpectedError("Array", typeof value, name);
}

function throwUnexpectedError(
  expectedType: string,
  actualType: string,
  name?: string
) {
  const nameToBe = name ? ` ${name} to be` : "";
  throw new Error(`Expected${nameToBe} ${expectedType}, got ${actualType}`);
}
