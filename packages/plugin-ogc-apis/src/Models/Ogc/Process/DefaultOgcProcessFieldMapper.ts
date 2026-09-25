import isDefined from "terriajs/lib/Core/isDefined";
import { isJsonObject, JsonObject } from "terriajs/lib/Core/Json";
import * as z from "zod";
import { InputField } from "../UiElements";

export interface InputDefinition<T = any> {
  id: string;
  name: string;
  description?: string;
  minOccurs?: number;
  maxOccurs?: number | "unbounded";
  schema: JsonObject;
  defaultValue?: T;
  getValue: () => T | undefined;
  setValue: (value: T | undefined) => void;
  getError: () => string | undefined;
}

function toInputField(def: InputDefinition): InputField | undefined {
  const type = def.schema.type;
  const enumValues = def.schema["enum"];
  const required = def.minOccurs !== undefined && def.minOccurs > 0;
  const common = {
    ...def,
    required
  };

  if (
    (type === "string" || type === "number") &&
    Array.isArray(enumValues) &&
    enumValues.every((v) => typeof v === type)
  ) {
    return {
      ...common,
      type: "enum",
      options: enumValues
        .map((value) =>
          isDefined(value) ? { value, label: value?.toString() } : undefined
        )
        .filter((option) => isDefined(option))
    };
  } else if (type === "string") {
    return { ...common, type: "text" };
  } else if (type === "number" || type === "integer") {
    return { ...common, type: "number" };
  } else if (type === "array") {
    let itemSchema = def.schema.items;
    if (!isJsonObject(itemSchema)) {
      itemSchema = { type: "text" };
    }

    let zodSchema: z.ZodType | undefined;
    try {
      zodSchema = z.fromJSONSchema(itemSchema);
    } catch (error) {
      console.log(error);
    }

    const getItemValue = (idx: number) => {
      const values = def.getValue();
      return Array.isArray(values) ? values.at(idx) : undefined;
    };

    const setItemValue = (idx: number, value: unknown) => {
      const values = def.getValue();
      const valuesArray = Array.isArray(values) ? values : [];
      valuesArray[idx] = value;
      def.setValue(valuesArray);
    };

    const getItemError = (idx: number) => {
      if (!zodSchema) {
        return;
      }

      const value = getItemValue(idx);
      const result = zodSchema.safeParse(value);
      return result.success ? undefined : z.prettifyError(result.error);
    };

    return {
      ...common,
      type: "array",
      newItem: (idx: number) =>
        toInputField({
          id: `${def.id}[${idx}]`,
          name: `Value ${(idx + 1).toString()}`,
          schema: itemSchema,
          getValue: () => getItemValue(idx),
          setValue: (value) => setItemValue(idx, value),
          getError: () => getItemError(idx)
        })
    };
  } else if (
    def.schema.$ref ===
    "http://schemas.opengis.net/ogcapi/features/part1/1.0/openapi/schemas/geometryGeoJSON.yaml"
  ) {
    return { ...common, type: "geojson" };
  } else if (def.id === "geometry") {
    // TODO: fix
    return { ...common, type: "geojson" };
  } else {
    return { ...common, type: "text" };
  }
}

export default { toInputField };
