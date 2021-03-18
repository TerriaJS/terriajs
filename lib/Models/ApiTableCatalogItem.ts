import { computed, runInAction } from "mobx";
import { DataSource } from "terriajs-cesium";
import loadJson from "../Core/loadJson";
import TerriaError from "../Core/TerriaError";
import AutoRefreshingMixin from "../ModelMixins/AutoRefreshingMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import { MapItem, ImageryParts } from "../ModelMixins/MappableMixin";
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
export class ApiTableCatalogItem extends AutoRefreshingMixin(
  TableMixin(CatalogMemberMixin(CreateModel(ApiTableCatalogItemTraits)))
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
    return Promise.resolve();
  }

  protected async forceLoadTableData(): Promise<string[][]> {
    // TODO: enforce required traits

    const positionApiResponse: any[] = await loadJson(
      proxyCatalogItemUrl(this, this.positionStep.apiUrl!)
    );
    const valueApiResponse: any[] = await loadJson(
      proxyCatalogItemUrl(this, this.valueStep.apiUrl!)
    );

    const positionForId: Map<
      string,
      { latitude: string; longitude: string }
    > = new Map();

    positionApiResponse.forEach(position => {
      positionForId.set(position[this.idKey!], {
        latitude: position[this.positionStep.latitudeKey!],
        longitude: position[this.positionStep.longitudeKey!]
      });
    });

    const values: string[][] = this.valueStep.keyToColumnMapping.map(
      mapping => [mapping.columnName!]
    );
    const latitudeColumnIdx = values.push(["latitude"]) - 1;
    const longitudeColumnIdx = values.push(["longitude"]) - 1;

    for (let valueResponse of valueApiResponse) {
      this.valueStep.keyToColumnMapping.forEach((mapping, columnIdx) => {
        let cellValue = valueResponse[mapping.keyInApiResponse!];
        if (cellValue === undefined) {
          cellValue = "";
        }
        values[columnIdx].push(`${cellValue}`);

        const id = valueResponse[this.idKey!];
        const position = positionForId.get(id);
        values[latitudeColumnIdx].push(position?.latitude ?? "");
        values[longitudeColumnIdx].push(position?.longitude ?? "");
      });
    }

    return values;
  }

  refreshData(): void {
    this.forceLoadTableData();
  }
}

StratumOrder.addLoadStratum(automaticTableStylesStratumName);
