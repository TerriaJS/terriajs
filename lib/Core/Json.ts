type JsonValue =  boolean | number | string | null | JsonArray | JsonObject;
export interface JsonObject {  [key: string]: JsonValue; }
export interface JsonArray extends Array<JsonValue> {}
export default JsonValue;
