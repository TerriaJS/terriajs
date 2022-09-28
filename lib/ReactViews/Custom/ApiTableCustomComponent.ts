import { ApiTableCatalogItem } from "../../Models/Catalog/CatalogItems/ApiTableCatalogItem";
import CommonStrata from "../../Models/Definition/CommonStrata";
import updateModelFromJson from "../../Models/Definition/updateModelFromJson";
import ChartCustomComponent, {
  ChartCustomComponentAttributes
} from "./ChartCustomComponent";
import { ProcessNodeContext } from "./CustomComponent";

interface ApiTableCustomChartComponentAttributes
  extends ChartCustomComponentAttributes {
  /**
   * The catalog JSON for an ApiTableCatalogItem as a string
   */
  apiTableCatalogItemJson: string;
}

export default class ApiTableChartCustomComponent extends ChartCustomComponent<ApiTableCatalogItem> {
  get name(): string {
    return "api-chart";
  }

  get attributes(): string[] {
    return ["api-table-catalog-item-json"];
  }

  protected constructCatalogItem(
    id: string | undefined,
    context: ProcessNodeContext,
    sourceReference: ApiTableCatalogItem | undefined
  ): ApiTableCatalogItem | undefined {
    const terria = context.terria;
    // This differs from other custom in that if a catalog item with the same id has already been created, it'll return that rather than a new one
    // This is required for the `updateModelFromJson` call in `setTraitsFromAttrs` to work
    const existingModel = id
      ? context.terria?.getModelById(ApiTableCatalogItem, id)
      : undefined;
    if (terria && existingModel === undefined) {
      return new ApiTableCatalogItem(id, terria);
    }
    return existingModel;
  }

  protected setTraitsFromAttrs(
    item: ApiTableCatalogItem,
    attrs: ApiTableCustomChartComponentAttributes,
    sourceIndex: number
  ): void {
    const json: any | undefined = attrs.apiTableCatalogItemJson;
    if (json === undefined) {
      return;
    }

    json.id = item.uniqueId;
    updateModelFromJson(item, CommonStrata.definition, json, true).logError(
      "Error ocurred while updating ApiTableChartCustomComponent model from JSON"
    );
  }

  protected parseNodeAttrs(nodeAttrs: {
    [name: string]: string | undefined;
  }): ApiTableCustomChartComponentAttributes {
    const parsed: ApiTableCustomChartComponentAttributes = super.parseNodeAttrs(
      nodeAttrs
    ) as ApiTableCustomChartComponentAttributes;
    const jsonAttr = nodeAttrs["api-table-catalog-item-json"];
    if (jsonAttr === undefined) {
      return parsed;
    }

    try {
      parsed.apiTableCatalogItemJson = JSON.parse(jsonAttr);
    } catch (e) {
      console.error("Couldn't parse json for ApiTableChartCustomComponent");
    }

    return parsed;
  }
}
