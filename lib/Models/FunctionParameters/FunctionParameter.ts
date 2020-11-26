import { computed, runInAction } from "mobx";
import combine from "terriajs-cesium/Source/Core/combine";
import isDefined from "../../Core/isDefined";
import JsonValue, { JsonObject } from "../../Core/Json";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";
import omit from "lodash-es/omit";

export interface Options {
  id: string;
  name?: string;
  description?: string;
  isRequired?: boolean;
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

  constructor(
    protected readonly catalogFunction: CatalogFunctionMixin,
    options: Options
  ) {
    this.id = options.id;
    this.name = options.name || this.id;
    this.description = options.description || "";
    this.isRequired = options.isRequired || false;
  }

  @computed
  get isValid(): boolean {
    if (!isDefined(this.value)) {
      return !this.isRequired;
    }

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
        this.catalogFunction.setTrait(
          strataId,
          "parameters",
          omit(this.catalogFunction.parameters, this.id)
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
