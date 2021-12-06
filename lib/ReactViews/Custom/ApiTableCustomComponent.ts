import { ApiTableCatalogItem } from "../../Models/Catalog/CatalogItems/ApiTableCatalogItem";
import CatalogMemberFactory from "../../Models/Catalog/CatalogMemberFactory";
import CommonStrata from "../../Models/Definition/CommonStrata";
import { BaseModel } from "../../Models/Definition/Model";
import upsertModelFromJson from "../../Models/Definition/upsertModelFromJson";
import ChartCustomComponent, {
  ChartCustomComponentAttributes
} from "./ChartCustomComponent";
import { ProcessNodeContext } from "./CustomComponent";

interface ApiTableCustomComponentAttributes
  extends ChartCustomComponentAttributes {
  /**
   * The catalog JSON for an ApiTableCatalogItem as a string
   */
  apiTableCatalogItemJson: string;
}

export default class ApiTableCustomComponent extends ChartCustomComponent<
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
    attrs: ApiTableCustomComponentAttributes,
    sourceIndex: number
  ): void {
    const json: any = attrs.apiTableCatalogItemJson;
    json.id = item.uniqueId;
    const result = upsertModelFromJson(
      CatalogMemberFactory,
      item.terria,
      "",
      CommonStrata.definition,
      json,
      {}
    );
  }

  protected parseNodeAttrs(nodeAttrs: {
    [name: string]: string | undefined;
  }): ApiTableCustomComponentAttributes {
    const parsed: ApiTableCustomComponentAttributes = super.parseNodeAttrs(
      nodeAttrs
    ) as ApiTableCustomComponentAttributes;
    const jsonAttr = nodeAttrs["api-table-catalog-item-json"];
    if (jsonAttr === undefined) {
      return parsed;
    }

    parsed.apiTableCatalogItemJson = JSON.parse(jsonAttr);
    return parsed;
  }
}
