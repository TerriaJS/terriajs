import { observable, computed, action } from "mobx";
import isDefined from "../Core/isDefined";
import CatalogFunctionMixin from "../ModelMixins/CatalogFunctionMixin";
import CommonStrata from "./CommonStrata";
import JsonValue, { JsonObject } from "../Core/Json";
import { Feature, FeatureCollection } from "geojson";

export interface Options {
  id: string;
  name?: string;
  description?: string;
  isRequired?: boolean;
  converter?: unknown;
  value?: any;
}

export default abstract class FunctionParameter<
  T extends JsonValue | undefined = JsonValue
> {
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
    this.setValue(CommonStrata.defaults, options.value);
  }

  @computed 
  isValid(): boolean {
    return true
  }

  @computed
  get value(): T {
    return this.catalogFunction.parameters?.[this.id] as T;
  }

  @action
  setValue(strataId: string, v: T) {
    if (isDefined(v)) {
      let parameterTraits = this.catalogFunction.getTrait(
        strataId,
        "parameters"
      );
      if (!isDefined(parameterTraits)) {
        this.catalogFunction.setTrait(strataId, "parameters", {
          [this.id]: v!
        });
      } else {
        this.catalogFunction.setTrait(
          strataId,
          "parameters",
          Object.assign(this.catalogFunction.parameters, { [this.id]: v })
        );
      }

    // v not defined -> delete parameter
    } else {
      const newParameters = Object.assign({} , this.catalogFunction.parameters)
      delete newParameters[this.id]
      this.catalogFunction.setTrait(
        strataId,
        "parameters",
        newParameters
      );
    }
  }

  formatValueAsString(value?: unknown) {
    value = isDefined(value) ? value : this.value;
    return isDefined(value) ? (<any>value).toString() : "-";
  }
}
