import { computed, runInAction } from "mobx";
import isDefined from "../../Core/isDefined";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";
import JsonValue, { JsonObject } from "../../Core/Json";
import { Feature } from "geojson";

import combine from "terriajs-cesium/Source/Core/combine";

export interface Options {
  id: string;
  name?: string;
  description?: string;
  isRequired?: boolean;
  converter?: unknown;
}

export default abstract class FunctionParameter<
  T extends JsonValue | undefined = JsonValue
> {
  readonly isFunctionParameter = true;
  abstract readonly type: string;
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly isRequired: boolean;
  readonly converter?: unknown;

  readonly geoJsonFeature?: Promise<Feature> | Feature | JsonObject | undefined;

  constructor(
    private readonly catalogFunction: CatalogFunctionMixin,
    options: Options
  ) {
    this.id = options.id;
    this.name = options.name || this.id;
    this.description = options.description || "";
    this.isRequired = options.isRequired || false;
    this.converter = options.converter;
  }

  isValid(): boolean {
    return true;
  }

  @computed
  get value(): T | undefined {
    return this.catalogFunction.parameters?.[this.id] as T;
  }

  setValue(strataId: string, v: T) {
    if (isDefined(v)) {
      let newParameters: JsonObject = {
        [this.id]: v!
      };
      if (isDefined(this.catalogFunction.parameters)) {
        newParameters = combine(newParameters, this.catalogFunction.parameters);
      }
      runInAction(() => {
        this.catalogFunction.setTrait(strataId, "parameters", newParameters);
      });
    } else {
      this.clearValue(strataId);
    }
  }

  clearValue(strataId: string) {
    if (isDefined(this.catalogFunction.parameters?.[this.id])) {
      runInAction(() => {
        delete this.catalogFunction.parameters![this.id];
        this.catalogFunction.setTrait(
          strataId,
          "parameters",
          this.catalogFunction.parameters
        );
      });
    }
  }

  formatValueAsString(value?: unknown) {
    value = isDefined(value) ? value : this.value;
    return isDefined(value) ? (<any>value).toString() : "-";
  }

  static isInstanceOf(obj: any): obj is FunctionParameter {
    return obj.isFunctionParameter;
  }
}
