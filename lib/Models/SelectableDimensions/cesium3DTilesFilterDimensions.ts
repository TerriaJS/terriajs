import i18next from "i18next";
import Mustache from "mustache";
import filterOutUndefined from "../../Core/filterOutUndefined";
import { FilterTraits } from "../../Traits/TraitsClasses/Cesium3dTilesFilterTraits";
import Model from "../Definition/Model";
import {
  FlatSelectableDimension,
  SelectableDimension
} from "./SelectableDimensions";

type FilterType = "enum" | "range" | "numeric";

interface FilterBuilder {
  buildExpression: (filter: Model<FilterTraits>) => string | undefined;

  buildSelectableDimension: (
    filter: Model<FilterTraits>
  ) => FlatSelectableDimension | undefined;
}

const filterBuilders: Record<FilterType, FilterBuilder> = {
  enum: {
    buildExpression: filter => {
      const values = filter.enum.value ?? [];
      if (values.length === 0) {
        return;
      }

      const defaultExpression = (propertyName: string) => {
        const property = `String(${safePropertyName(propertyName)})`;
        return `${property} === '{{value}}'`;
      };

      const expressionTemplate =
        filter.expression !== undefined
          ? filter.expression
          : filter.propertyName
          ? defaultExpression(filter.propertyName)
          : undefined;

      if (expressionTemplate === undefined) {
        return undefined;
      }
      return values
        .map(value => Mustache.render(expressionTemplate, { value }))
        .join(" || ");
    },

    buildSelectableDimension: filter => {
      const enumFilter = filter.enum;
      const selectedIds = [...(enumFilter.value ?? [])];
      const options =
        enumFilter.optionValues && enumFilter.optionValues.length > 0
          ? enumFilter.optionValues.map(value => ({
              id: value,
              name: value
            }))
          : enumFilter.options.map(({ value, displayName }) => ({
              id: value,
              name: displayName ?? value
            }));

      if (options.length === 0) {
        return undefined;
      }

      return {
        type: "multi-select",
        id: filter.name,
        name: filter.name,
        selectedIds,
        options,
        allowUndefined: true,
        setDimensionValue: (stratumId, values) =>
          enumFilter.setTrait(stratumId, "value", values)
      };
    }
  },

  range: {
    buildExpression: filter => {
      const range = filter.range;
      if (range.min === undefined || range.max === undefined) {
        return undefined;
      }

      if (range.value.min === undefined && range.value.max === undefined) {
        return undefined;
      }

      const defaultExpression = (propertyName: string) => {
        const property = `Number(${safePropertyName(propertyName)})`;
        return `${property} >= {{value.minimum}} && ${property} <= {{value.maximum}}`;
      };

      const expressionTemplate =
        filter.expression !== undefined
          ? filter.expression
          : filter.propertyName
          ? defaultExpression(filter.propertyName)
          : undefined;

      if (expressionTemplate === undefined) {
        return undefined;
      }

      const expression = Mustache.render(expressionTemplate, {
        value: {
          minimum: range.value.min ?? range.min,
          maximum: range.value.max ?? range.max
        }
      });
      return expression;
    },

    buildSelectableDimension: filter => {
      const range = filter.range;
      if (range.min === undefined || range.max === undefined) {
        return undefined;
      }

      return {
        type: "range",
        id: filter.name,
        name: filter.name,
        min: range.min,
        max: range.max,
        value: {
          min: range.value.min,
          max: range.value.max
        },
        setDimensionValue: (stratumId, value) => {
          range.value.setTrait(stratumId, "min", value?.min);
          range.value.setTrait(stratumId, "max", value?.max);
        }
      };
    }
  },

  numeric: {
    buildExpression: filter => {
      const value = filter.numeric.value;
      if (value === undefined) {
        return;
      }

      const defaultExpression = (propertyName: string) => {
        const property = `Number(${safePropertyName(propertyName)})`;
        return `${property} === {{value}}`;
      };

      const propertyName = filter.propertyName;
      const expressionTemplate =
        filter.expression !== undefined
          ? filter.expression
          : propertyName
          ? defaultExpression(propertyName)
          : undefined;

      if (expressionTemplate === undefined) {
        return undefined;
      }

      const expression = Mustache.render(expressionTemplate, { value });
      return expression;
    },

    buildSelectableDimension: filter => {
      const numeric = filter.numeric;
      const placeholderText =
        numeric.min !== undefined && numeric.max !== undefined
          ? `${numeric.min} to ${numeric.max}`
          : numeric.min !== undefined
          ? `From ${numeric.min}`
          : numeric.max !== undefined
          ? `Upto ${numeric.max}`
          : undefined;
      return {
        type: "numeric",
        name: filter.name,
        id: filter.name,
        min: numeric.min,
        max: numeric.max,
        value: numeric.value,
        placeholderText,
        setDimensionValue: (stratumId, value) =>
          numeric.setTrait(
            stratumId,
            "value",
            isNaN(value!) ? undefined : value
          )
      };
    }
  }
};

const filterTypes: Map<string, FilterType> = new Map(
  Object.keys(filterBuilders).map(type => [type, type as FilterType])
);

function isValueSet(filter: Model<FilterTraits>): boolean {
  switch (filterTypes.get(filter.type)) {
    case "enum":
      return filter.enum.value && filter.enum.value.length > 0;
    case "range":
      return (
        filter.range.value.min !== undefined ||
        filter.range.value.max !== undefined
      );
    case "numeric":
      return filter.numeric.value !== undefined;
    case undefined:
      return false;
  }
}

export function buildFilterExpression(
  filters: Model<FilterTraits>[]
): string | undefined {
  const exprs = filterOutUndefined(
    filters.map(filter => getBuilder(filter)?.buildExpression(filter))
  );
  return exprs.length === 0 ? undefined : exprs.map(e => `(${e})`).join(" && ");
}

export function buildSelectableDimensions(
  filters: Model<FilterTraits>[]
): SelectableDimension[] {
  const selectableDimensions = filterOutUndefined(
    filters.map(filter => {
      const dim = getBuilder(filter)?.buildSelectableDimension(filter);
      return dim;
    })
  );

  if (selectableDimensions.length === 0) {
    return [];
  }

  const activeCount = filters.filter(filter => isValueSet(filter)).length;
  return [
    {
      type: "group",
      id: "feature-filters",
      name: i18next.t("models.featureFilter.title", {
        activeCount: activeCount > 0 ? `(${activeCount})` : ""
      }),
      selectableDimensions
    }
  ];
}

function getBuilder(filter: Model<FilterTraits>) {
  const filterType = filterTypes.get(filter.type);
  if (filterTypes === undefined) {
    console.error(`Invalid filter type: ${filter.type}`);
  }
  return filterType ? filterBuilders[filterType] : undefined;
}

function safePropertyName(propertyName: string) {
  return "${feature['" + propertyName.replace(/'/g, "\\'") + "']}";
}

// import i18next from "i18next";
// import Cesium3dTilesMixin from "../../ModelMixins/Cesium3dTilesMixin";
// import { FilterTraits } from "../../Traits/TraitsClasses/Cesium3dTilesFilterTraits";
// import Model from "../Definition/Model";
// import {
//   SelectableDimension,
//   SelectableDimensionGroup
// } from "./SelectableDimensions";
// import filterOutUndefined from "../../Core/filterOutUndefined";

// export function buildFilterExpression(
//   item: Cesium3dTilesMixin.Instance
// ): string | undefined {
//   const filters = item.filters;
//   const expressions = filterOutUndefined(
//     filters.map(filter => {
//       const propertyName =
//         filter.propertyName === undefined
//           ? undefined
//           : safePropertyName(filter.propertyName);

//       if (propertyName === undefined) {
//         return undefined;
//       }

//       if (isEnumDefined(filter)) {
//         const enumFilter = filter.enum;
//         const values = enumFilter.values;
//         const subExpressions = values.map(
//           value => `String(${propertyName}) === '${value}'`
//         );
//         const enumExpr = subExpressions.join(` || `);
//         return enumExpr;
//       } else if (isRangeDefined(filter)) {
//         const rangeFilter = filter.range;
//         const value = rangeFilter.value;
//         const rangeExpr =
//           value === undefined
//             ? undefined
//             : `Number(${safePropertyName}) >= ${value.minimum} && Number(${safePropertyName}) <= ${value.maximum}`;
//         return rangeExpr;
//       } else {
//         return undefined;
//       }
//     })
//   );
//   return expressions.length === 0 ? undefined : expressions.join(" && ");
// }

// export function buildSelectableDimensions(
//   item: Cesium3dTilesMixin.Instance
// ): SelectableDimension[] {
//   const filters = item.filters;
//   const selectableDimensions: SelectableDimension[] = [];
//   let activeCount = 0;

//   filters.forEach(filter => {
//     if (isEnumDefined(filter)) {
//       const enumFilter = filter.enum;
//       const values = enumFilter.values;
//       if (values.length > 0) {
//         activeCount += 1;
//       }
//       selectableDimensions.push({
//         type: "multi-select",
//         id: filter.name,
//         name: filter.name,
//         selectedIds: [...values],
//         options: enumFilter.options.map(({ value, displayName }) => ({
//           id: value,
//           name: displayName ?? value
//         })),
//         allowUndefined: true,
//         setDimensionValue: (stratumId, values) =>
//           enumFilter.setTrait(stratumId, "values", values)
//       });
//     } else if (isRangeDefined(filter)) {
//       const rangeFilter = filter.range;
//       if (rangeFilter.value !== undefined) {
//         activeCount += 1;
//       }
//       selectableDimensions.push({
//         type: "numeric",
//         id: filter.name,
//         name: filter.name,
//         value: rangeFilter.value,
//         min: filter.range.minimum,
//         max: filter.range.maximum,
//         allowUndefined: true,
//         setDimensionValue: (stratumId, value) =>
//           rangeFilter.setTrait(stratumId, "value", value)
//       });
//     }
//   });

//   return selectableDimensions.length === 0
//     ? []
//     : [
//         {
//           type: "group",
//           id: "feature-filters",
//           name: i18next.t("models.featureFilter.title", {
//             activeCount: activeCount > 0 ? `(${activeCount})` : ""
//           }),
//           selectableDimensions,
//           selectedId:
//             item.applyFilters === true && activeCount > 0 ? "true" : "false"
//         } as SelectableDimensionGroup
//       ];
// }

// function isEnumDefined(filter: Model<FilterTraits>) {
//   return filter.enum.options.length > 0;
// }

// function isRangeDefined(filter: Model<FilterTraits>): boolean {
//   // either minimum or maximum is set
//   return (
//     filter.range.minimum !== undefined || filter.range.maximum !== undefined
//   );
// }

// function safePropertyName(propertyName: string) {
//   return "${feature['" + propertyName.replace(/'/g, "\\'") + "']}";
// }

// import i18next from "i18next";
// import Cesium3dTilesMixin from "../../ModelMixins/Cesium3dTilesMixin";
// import {
//   EnumFilterTraits,
//   FilterTraits,
//   RangeFilterTraits
// } from "../../Traits/TraitsClasses/Cesium3dTilesFilterTraits";
// import Model from "../Definition/Model";
// import { SelectableDimension } from "./SelectableDimensions";

// type FilterType = "enum" | "range";

// type Traits<F> = F extends "enum"
//   ? EnumFilterTraits
//   : F extends "range"
//   ? RangeFilterTraits
//   : never;

// interface FilterBuilder {
//   buildExpression: (filter: Model<FilterTraits>) => string | undefined;
//   isValueSet: (filter: Model<FilterTraits>) => boolean;
// }

// const filterBuilders: Record<FilterType, FilterBuilder> = {
//   enum: {
//     buildExpression: filter => {
//       return undefined;
//     },

//     isValueSet: filter => filter.enum.values.length > 0
//   },

//   range: {
//     buildExpression: filter => {
//       return undefined;
//     },

//     isValueSet: filter => filter.range.value !== undefined
//   }
// };

// export function buildExpression(filters: Model<FilterTraits>[]) {
//   const subExpressions = filters.map(filter => {
//     const filterType = getFilterType(filter);
//     const propertyName = filter.propertyName;
//     if (filterType === undefined || propertyName === undefined) {
//       return undefined;
//     }
//     const expr = filterBuilders[filterType].buildExpression(filter);
//     return expr;
//   });
//   return subExpressions.length === 0 ? undefined : subExpressions.join(" && ");
// }

// export function buildSelectableDimensions(
//   item: Cesium3dTilesMixin.Instance
// ): SelectableDimension[] {
//   const filters = item.filters;
//   const selectableDimensions = filters.map(filter => {});
//   const activeCount = filters.filter(filter => {
//     const filterType = getFilterType(filter);
//     return filterType ? filterBuilders[filterType].isValueSet(filter) : false;
//   }).length;

//   return selectableDimensions.length === 0
//     ? []
//     : [
//         {
//           type: "group",
//           id: "feature-filters",
//           name: i18next.t("models.featureFilter.title", {
//             activeCount: activeCount > 0 ? `(${activeCount})` : ""
//           }),
//           selectableDimensions,
//           selectedId:
//             item.applyFilters === true && activeCount > 0 ? "true" : "false"
//         }
//       ];
// }

// export function getFilterType(
//   filter: Model<FilterTraits>
// ): FilterType | undefined {
//   return isEnumDefined(filter)
//     ? "enum"
//     : isRangeDefined(filter)
//     ? "range"
//     : undefined;
// }

// function isEnumDefined(filter: Model<FilterTraits>) {
//   return filter.enum.options.length > 0;
// }

// function isRangeDefined(filter: Model<FilterTraits>): boolean {
//   // either minimum or maximum is set
//   return (
//     filter.range.minimum !== undefined || filter.range.maximum !== undefined
//   );
// }

// import i18next from "i18next";
// import filterOutUndefined from "../../Core/filterOutUndefined";
// import Cesium3dTilesMixin from "../../ModelMixins/Cesium3dTilesMixin";
// import {
//   FilterTraits,
//   EnumFilterTraits,
//   RangeFilterTraits
// } from "../../Traits/TraitsClasses/Cesium3dTilesFilterTraits";
// import Model from "../Definition/Model";
// import {
//   SelectableDimension,
//   SelectableDimensionEnum,
//   SelectableDimensionEnumMultiple,
//   SelectableDimensionNumeric
// } from "./SelectableDimensions";

// export type FilterType = "enum" | "range";

// interface FilterBuilder {
//   buildExpression: (
//     propertyName: string,
//     filter: Model<FilterTraits>
//   ) => string | undefined;

//   buildSelectableDimension: (
//     filter: Model<FilterTraits>
//   ) => SelectableDimension | undefined;

//   hasValue: (filter: Model<FilterTraits>) => boolean;
// }

// const filterBuilders: Record<FilterType, FilterBuilder> = {
//   enum: {
//     buildExpression(propertyName: string, filter: Model<FilterTraits>) {
//       const values = filter.enum.values;
//       const subExpressions = values.map(
//         value => `String(${propertyName}) === '${value}'`
//       );
//       const expression =
//         subExpressions.length === 0 ? undefined : subExpressions.join(" && ");
//       return expression;
//     },

//     buildSelectableDimension(filter: Model<FilterTraits>) {
//       const dim: SelectableDimensionEnumMultiple = {
//         type: "multi-select",
//         id: filter.name,
//         name: filter.name,
//         selectedId: [...filter.enum.values],
//         options: filter.enum.options.map(({ value, displayName }) => ({
//           id: value,
//           name: displayName ?? value
//         })),
//         allowUndefined: true,
//         setDimensionValue: (stratumId, values) =>
//           filter.enum.setTrait(stratumId, "values", values)
//       };
//       return dim;
//     },

//     hasValue: (filter: Model<FilterTraits>) => filter.enum.values.length > 0
//   },

//   range: {
//     buildExpression(propertyName: string, filter: Model<FilterTraits>) {
//       const value = filter.range.value;
//       const expression =
//         value === undefined
//           ? undefined
//           : `Number(${propertyName}) === ${value}`;
//       return expression;
//     },

//     buildSelectableDimension(filter: Model<FilterTraits>) {
//       const minimum = filter.range.minimum ?? -Infinity;
//       const maximum = filter.range.maximum ?? Infinity;

//       const isInRange = (value: any) =>
//         typeof value === "number" && value >= minimum && value <= maximum
//           ? true
//           : false;

//       return {
//         type: "numeric",
//         id: filter.name,
//         name: filter.name,
//         value: isInRange(filter.range.value)
//           ? (filter.range.value as number)
//           : undefined,
//         min: filter.range.minimum,
//         max: filter.range.maximum,
//         allowUndefined: true,
//         setDimensionValue: (stratumId, value) =>
//           filter.range.setTrait(
//             stratumId,
//             "value",
//             isInRange(value) ? value : undefined
//           )
//       };
//     },

//     hasValue: (filter: Model<FilterTraits>) => filter.range.value !== undefined
//   }
// };

// export function buildExpressionFromFilters(
//   filters: Model<FilterTraits>[]
// ): string | undefined {
//   const exprs = filterOutUndefined(
//     filters.map(filter => {
//       const filterType = getFilterType(filter);
//       if (filterType === undefined || filter.propertyName === undefined) {
//         return undefined;
//       }
//       const propertyName = safePropertyName(filter.propertyName);
//       const expression = filterBuilders[filterType].buildExpression(
//         propertyName,
//         filter
//       );
//       return expression;
//     })
//   );
//   return exprs.length > 0 ? exprs.join(" && ") : undefined;
// }

// export function getFilterType(
//   filter: Model<FilterTraits>
// ): FilterType | undefined {
//   return isEnumFilter(filter)
//     ? "enum"
//     : isRangeFilter(filter)
//     ? "range"
//     : undefined;
// }

// export default function cesium3DTilesFilterDimensions(
//   item: Cesium3dTilesMixin.Instance
// ): SelectableDimension[] {
//   const selectableDimensions = filterOutUndefined(
//     item.filters.map(filter => {
//       const filterType = getFilterType(filter);
//       return filterType
//         ? filterBuilders[filterType].buildSelectableDimension(filter)
//         : undefined;
//     })
//   );

//   const activeCount = item.filters.filter(
//     filter => getFilterValue(filter) !== undefined
//   ).length;

//   return selectableDimensions.length > 0
//     ? [
//         {
//           type: "group",
//           id: "feature-filters",
//           name: i18next.t("models.featureFilter.title", {
//             activeCount: activeCount > 0 ? `(${activeCount})` : ""
//           }),
//           selectableDimensions,
//           selectedId:
//             item.applyFilters === true && activeCount > 0 ? "true" : "false"
//         }
//       ]
//     : [];
// }

// function createEnumFilterDimensions(
//   filter: Model<FilterTraits>
// ): SelectableDimensionEnum {
//   return {
//     type: "select",
//     id: filter.name,
//     name: filter.name,
//     selectedId: typeof filter.value === "string" ? filter.value : undefined,
//     options: filter.enum.options.map(({ value, displayName }) => ({
//       id: value,
//       name: displayName ?? value
//     })),
//     allowUndefined: true,
//     setDimensionValue: (stratumId, value) => {
//       const validValue = filter.enum.options.some(opt => opt.value === value);
//       filter.setTrait(stratumId, "value", validValue ? value : undefined);
//     }
//   };
// }

// function createRangeFilterDimensions(
//   filter: Model<FilterTraits>
// ): SelectableDimensionNumeric | undefined {
//   const minimum = filter.range.minimum ?? -Infinity;
//   const maximum = filter.range.maximum ?? Infinity;

//   const isInRange = (value: any) =>
//     typeof value === "number" && value >= minimum && value <= maximum
//       ? true
//       : false;

//   return {
//     type: "numeric",
//     id: filter.name,
//     name: filter.name,
//     value: isInRange(filter.value) ? (filter.value as number) : undefined,
//     min: filter.range.minimum,
//     max: filter.range.maximum,
//     allowUndefined: true,
//     setDimensionValue: (stratumId, value) =>
//       filter.setTrait(stratumId, "value", isInRange(value) ? value : undefined)
//   };
// }

// function isEnumFilter(filter: Model<FilterTraits>) {
//   return filter.enum.options.length > 0;
// }

// function isRangeFilter(filter: Model<FilterTraits>): boolean {
//   // either minimum or maximum is set
//   return (
//     filter.range.minimum !== undefined || filter.range.maximum !== undefined
//   );
// }

// function safePropertyName(propertyName: string) {
//   return "${feature['" + propertyName.replace(/'/g, "\\'") + "']}";
// }
