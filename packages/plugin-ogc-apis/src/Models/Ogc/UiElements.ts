/**
 *
 * - define input fields
 * - get/set input values
 * - validate inputs fields
 * - specify a few display options
 * - add new types of input fields
 *
 * - render fields using different renderers
 */

import { Feature, FeatureCollection } from "geojson";

export interface InputFields {
  text: TextField;
  number: NumberField;
  enum: EnumField<any>;
  multiEnum: MultiEnumField<any>;
  array: ArrayField;
  geojson: GeojsonField;
  //debouncedField: DebouncedField<any>;
}

type PrimitiveFields = InputFields[Exclude<keyof InputFields, "array">];

export type InputField = InputFields[keyof InputFields];

interface BaseField<T> {
  id: string;
  name: string;
  description?: string;
  required?: boolean;
  defaultValue?: T;
  getValue: () => T | undefined;
  setValue: (value: T | undefined) => void;
  getError: () => string | undefined;
}

export interface TextField extends BaseField<string> {
  type: "text";
}

export interface NumberField extends BaseField<number> {
  type: "number";
}

export interface GeojsonField extends BaseField<FeatureCollection | Feature> {
  type: "geojson";
}

export interface EnumField<T extends string | number> extends BaseField<T> {
  type: "enum";
  options: { label: string; value: T }[];
}

export interface MultiEnumField<
  T extends string[] | number[]
> extends BaseField<T> {
  type: "multiEnum";
  options: { title: string; value: T }[];
}

export interface ArrayField<TField extends InputField = any> extends BaseField<
  ReturnType<TField["getValue"]>[]
> {
  type: "array";
  newItem: (idx: number) => InputField | undefined;
}
