import { observable } from "mobx";
import isDefined from "../Core/isDefined";

export interface Options {
  id: string;
  name?: string;
  description?: string;
  isRequired?: boolean;
  converter: unknown;
}

interface Feature {
  type: string;
  geometry: any;
}

export default abstract class FunctionParameter {
  abstract readonly type: string;
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly isRequired: boolean;
  readonly converter: unknown;

  @observable value?: unknown;

  readonly geoJsonFeature?: Promise<Feature> | Feature | undefined;

  constructor(options: Options) {
    this.id = options.id;
    this.name = options.name || this.id;
    this.description = options.description || "";
    this.isRequired = options.isRequired || false;
    this.converter = options.converter;
  }

  formatValueAsString(value?: unknown) {
    value = isDefined(value) ? value : this.value;
    return isDefined(value) ? (<any>value).toString() : "-";
  }
}
