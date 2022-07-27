import i18next from "i18next";
import { computed } from "mobx";
import filterOutUndefined from "../../Core/filterOutUndefined";
import Icon from "../../Styled/Icon";
import { FilterTraits } from "../../Traits/TraitsClasses/Cesium3dTilesFilterTraits";
import Cesium3DTilesCatalogItem from "../Catalog/CatalogItems/Cesium3DTilesCatalogItem";
import Model from "../Definition/Model";
import {
  SelectableDimensionEnum,
  SelectableDimensionNumeric
} from "../SelectableDimensions/SelectableDimensions";
import SelectableDimensionWorkflow, {
  SelectableDimensionWorkflowGroup
} from "./SelectableDimensionWorkflow";

export default class Cesium3DTilesFeatureFilterWorkflow
  implements SelectableDimensionWorkflow {
  constructor(readonly item: Cesium3DTilesCatalogItem) {}

  get name() {
    return i18next.t("workflows.3dTilesFeatureFilter.workflowName");
  }

  get icon() {
    return Icon.GLYPHS.eye;
  }

  @computed
  get selectableDimensions(): SelectableDimensionWorkflowGroup[] {
    const filters = this.item.filters;
    const filterDimensions = filters.map(filter => {
      if (filter.name === undefined) {
        return;
      } else if (isEnumFilter(filter)) {
        return this.createEnumFilterInputs(filter);
      } else if (isRangeFilter(filter)) {
        return this.createRangeFilterInputs(filter);
      } else {
        return undefined;
      }
    });
    return [
      {
        type: "group",
        name: "Filters",
        selectableDimensions: filterOutUndefined(filterDimensions)
      }
    ];
  }

  createEnumFilterInputs(
    filter: Model<FilterTraits>
  ): SelectableDimensionEnum | undefined {
    return {
      type: "select",
      id: filter.name,
      name: filter.name,
      selectedId: typeof filter.value === "string" ? filter.value : undefined,
      options: filter.enum.options.map(({ value, displayName }) => ({
        id: value,
        name: displayName ?? value
      })),
      allowUndefined: true,
      setDimensionValue: (stratumId, value) =>
        filter.setTrait(stratumId, "value", value)
    };
  }

  createRangeFilterInputs(
    filter: Model<FilterTraits>
  ): SelectableDimensionNumeric | undefined {
    const minimum = filter.range.min ?? -Infinity;
    const maximum = filter.range.max ?? Infinity;
    const value =
      typeof filter.value === "number" &&
      filter.value >= minimum &&
      filter.value <= maximum
        ? filter.value
        : undefined;
    return {
      type: "numeric",
      id: filter.name,
      name: filter.name,
      value,
      min: filter.range.min,
      max: filter.range.max,
      allowUndefined: true,
      setDimensionValue: (stratumId, value) =>
        filter.setTrait(stratumId, "value", value)
    };
  }
}

function isEnumFilter(filter: Model<FilterTraits>): boolean {
  return filter.enum.options.length > 0;
}

function isRangeFilter(filter: Model<FilterTraits>): boolean {
  return filter.range.min !== undefined || filter.range.max !== undefined;
}
