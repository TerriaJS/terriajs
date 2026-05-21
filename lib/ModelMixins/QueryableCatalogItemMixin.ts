import { computed, observable, action } from "mobx";
import Constructor from "../Core/Constructor";
import Model from "../Models/Definition/Model";
import StratumOrder from "../Models/Definition/StratumOrder";
import QueryableCatalogItemTraits from "../Traits/TraitsClasses/QueryableCatalogItemTraits";

type MixinModel = Model<QueryableCatalogItemTraits>;

export interface QueryableProperties {
  [name: string]: {
    label: string;
    type: string;
    measureUnit?: string;
    decimalPlaces: number;
    canAggregate: boolean;
    sumOnAggregation: boolean;
    distributionOnAggregation: boolean;
    enumMultiValue: boolean;
    dictionaryKeyProperties: {
      key: string;
      alias: string;
      queryProperty: string;
      valueProperty: string;
    }[];
  };
}

function QueryableCatalogItemMixin<T extends Constructor<MixinModel>>(Base: T) {
  abstract class QueryableCatalogItemMixin extends Base {
    constructor(...args: any[]) {
      super(...args);
    }

    get ENUM_ALL_VALUE(): string {
      return "--tutto";
    }

    @observable
    queryValues?: { [name: string]: string[] };

    @observable
    enumValues?: { [name: string]: string[] };

    @observable
    numberOfTotalElements?: number;

    @observable
    numberOfVisibleElements?: number;

    @computed
    get queryProperties(): QueryableProperties | undefined {
      return Object.assign(
        {},
        ...this.queryableProperties.map((property) => {
          const dictionaryKeyProperties = property.dictionaryKeyProperties.map(
            (elem) => {
              return {
                key: elem.key,
                alias: elem.alias,
                queryProperty: elem.queryProperty,
                valueProperty: elem.valueProperty
              };
            }
          );

          return {
            [property.propertyName]: {
              type: property.propertyType,
              label: property.propertyLabel,
              measureUnit: property.propertyMeasureUnit,
              decimalPlaces: property.propertyDecimalPlaces,
              canAggregate: property.canAggregate,
              sumOnAggregation: property.sumOnAggregation,
              distributionOnAggregation: property.distributionOnAggregation,
              enumMultiValue: property.enumMultiValue,
              dictionaryKeyProperties: dictionaryKeyProperties
            }
          };
        })
      );
    }

    @computed
    get hasQueryableCatalogItemMixin() {
      return true;
    }

    abstract filterData(): void;

    abstract getEnumValues(propertyName: string): string[];

    abstract getFeaturePropertiesByName(
      propertyNames: string[]
    ): { [key: string]: any }[];

    @action
    updateEnumValues() {
      if (!this.queryProperties) return;

      const enums = Object.entries(this.queryProperties)
        .filter(([_, property]) => property.type === "enum")
        .map(([name, property]) => {
          const values = this.getEnumValues(name);
          return {
            [name]: property.enumMultiValue
              ? Array.from(
                  new Set(
                    values
                      ?.map((elem) => elem.split(",").map((txt) => txt.trim()))
                      .flat()
                  )
                )
              : values
          };
        });
      this.enumValues = Object.assign({}, ...enums);
    }

    @action
    sanitizeQueryValues() {
      if (!this.queryValues || !this.enumValues || !this.queryProperties)
        return;

      let changed = false;
      for (const [name, property] of Object.entries(this.queryProperties)) {
        if (property.type !== "enum") continue;

        const currentValue = this.queryValues[name]?.[0] ?? "";
        if (currentValue === "" || currentValue === this.ENUM_ALL_VALUE)
          continue;

        const available = this.enumValues[name] ?? [];
        if (!available.includes(currentValue)) {
          this.queryValues[name] = [""];
          changed = true;
        }
      }

      if (changed) {
        this.filterData();
        this.updateEnumValues();
      }
    }

    @action
    initQueryValues() {
      if (!this.queryProperties) return;

      this.updateEnumValues();

      const initialValues = Object.entries(this.queryProperties).map(
        ([name, property]) => {
          if (property.type === "date") {
            return { [name]: ["", ""] };
          } else {
            return { [name]: [""] };
          }
        }
      );

      this.queryValues = Object.assign({}, ...initialValues);
    }

    /*@action
    resetQueryValues() {      
      this.queryValues = undefined;
    }*/

    @action
    cleanQueryValues() {
      this.queryValues = {};
      this.initQueryValues();
      this.filterData();
      this.updateEnumValues();
    }

    @action
    setQuery(propertyName: string, value: string[]): void {
      if (this.queryValues) {
        this.queryValues[propertyName] = value;
        this.filterData();
        this.updateEnumValues();
      }
    }
  }
  return QueryableCatalogItemMixin;
}

namespace QueryableCatalogItemMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof QueryableCatalogItemMixin>> {}

  export function isMixedInto(model: any): model is Instance {
    return model?.hasQueryableCatalogItemMixin;
  }

  export const stratumName = "queryableCatalogItemStratum";
  StratumOrder.addLoadStratum(stratumName);
}

export default QueryableCatalogItemMixin;
