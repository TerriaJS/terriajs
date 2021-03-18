import { computed, runInAction } from "mobx";
import loadJson from "../Core/loadJson";
import TerriaError from "../Core/TerriaError";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import TableMixin from "../ModelMixins/TableMixin";
import TableAutomaticStylesStratum from "../Table/TableAutomaticStylesStratum";
import ApiTableCatalogItemTraits from "../Traits/ApiTableCatalogItemTraits";
import CreateModel from "./CreateModel";
import LoadableStratum from "./LoadableStratum";
import { BaseModel } from "./Model";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import StratumOrder from "./StratumOrder";
import Terria from "./Terria";

const automaticTableStylesStratumName = TableAutomaticStylesStratum.stratumName;

class ApiTableStratum extends LoadableStratum(ApiTableCatalogItemTraits) {
  static stratumName = "apiTable";
  duplicateLoadableStratum(newModel: BaseModel): this {
    return new ApiTableStratum(newModel as ApiTableCatalogItem) as this;
  }

  static async load(item: ApiTableCatalogItem) {}
}

export class ApiTableCatalogItem extends TableMixin(
  CatalogMemberMixin(CreateModel(ApiTableCatalogItemTraits))
) {
  static readonly type = "api-table";

  constructor(id: string | undefined, terria: Terria) {
    super(id, terria);
    this.strata.set(
      automaticTableStylesStratumName,
      new TableAutomaticStylesStratum(this)
    );
  }

  protected async forceLoadMetadata(): Promise<void> {
    const stratum = ApiTableStratum.load(this);
    runInAction(() => this.strata.set(ApiTableStratum.stratumName, stratum));
  }
  protected async forceLoadTableData(): Promise<string[][]> {
    // TODO: enforce required traits
    if (this.positionStep.apiUrl === undefined) {
      throw new TerriaError({
        sender: this,
        title: "Error getting positions", // TODO: i18n
        message: "Error getting positions"
      });
    }

    // TODO: construct a map from id property and match lats and longs to their actual values
    const positionApiResponse = await loadJson(
      proxyCatalogItemUrl(this, this.positionStep.apiUrl)
    );
    const latitudeColumn = positionApiResponse.map(
      (position: any) => position[this.positionStep.latitudeKey!]
    );
    latitudeColumn.unshift("lat");
    const longitudeColumn = positionApiResponse.map(
      (position: any) => position[this.positionStep.longitudeKey!]
    );
    longitudeColumn.unshift("lon");

    const valueApiResponse = await loadJson(
      proxyCatalogItemUrl(this, this.valueStep.apiUrl!)
    );
    const values: string[] = [];
    for (let mapping of this.valueStep.keyToColumnMapping) {
      const column = valueApiResponse.map(
        (o: any) => o[mapping.keyInApiResponse!]
      );
      column.unshift(mapping.columnName!);
      values.push(column);
    }
    return Promise.resolve([latitudeColumn, longitudeColumn, ...values]);
  }
}

StratumOrder.addLoadStratum(automaticTableStylesStratumName);
