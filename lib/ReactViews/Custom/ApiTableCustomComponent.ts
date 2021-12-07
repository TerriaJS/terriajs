import { ApiTableCatalogItem } from "../../Models/Catalog/CatalogItems/ApiTableCatalogItem";
import CatalogMemberFactory from "../../Models/Catalog/CatalogMemberFactory";
import CommonStrata from "../../Models/Definition/CommonStrata";
import { BaseModel } from "../../Models/Definition/Model";
import updateModelFromJson from "../../Models/Definition/updateModelFromJson";
import upsertModelFromJson from "../../Models/Definition/upsertModelFromJson";
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

export default class ApiTableChartCustomComponent extends ChartCustomComponent<
  ApiTableCatalogItem
> {
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
    const json: any = attrs.apiTableCatalogItemJson;
    json.id = item.uniqueId;
    const result = updateModelFromJson(
      item,
      CommonStrata.definition,
      json,
      true
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

    parsed.apiTableCatalogItemJson = JSON.parse(jsonAttr);
    return parsed;
  }
}
