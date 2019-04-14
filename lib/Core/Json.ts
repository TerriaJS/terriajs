type JsonValue =  boolean | number | string | null | JsonArray | JsonObject;
export interface JsonObject {  [key: string]: JsonValue; }
export interface JsonArray extends Array<JsonValue> {}
export default JsonValue;

export function isJsonObject(value: JsonValue | undefined): value is JsonObject {
    return value !== undefined && value !== null && typeof value === 'object' && !Array.isArray(value);
}
