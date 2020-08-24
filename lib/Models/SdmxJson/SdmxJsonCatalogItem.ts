import i18next from "i18next";
import { runInAction, computed } from "mobx";
import AsyncChartableMixin from "../../ModelMixins/AsyncChartableMixin";
import TableMixin from "../../ModelMixins/TableMixin";
import DiscretelyTimeVaryingMixin from "../../ModelMixins/DiscretelyTimeVaryingMixin";
import ExportableMixin from "../../ModelMixins/ExportableMixin";
import UrlMixin from "../../ModelMixins/UrlMixin";
import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import CreateModel from "../CreateModel";
import SdmxCatalogItemTraits from "../../Traits/SdmxCatalogItemTraits";
import Terria from "../Terria";
import { BaseModel } from "../Model";
import TableAutomaticStylesStratum from "../../Table/TableAutomaticStylesStratum";
import isDefined from "../../Core/isDefined";
import TerriaError from "../../Core/TerriaError";
import Csv from "../../Table/Csv";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import StratumOrder from "../StratumOrder";
import Resource from "terriajs-cesium/Source/Core/Resource";
import { SdmxJsonDataflowStratum } from "./SdmxJsonDataflowStratum";

const automaticTableStylesStratumName = "automaticTableStyles";

export default class SdmxJsonCatalogItem extends AsyncChartableMixin(
  TableMixin(
    // Since both TableMixin & DiscretelyTimeVaryingMixin defines
    // `chartItems`, the order of mixing in is important here
    DiscretelyTimeVaryingMixin(
      ExportableMixin(
        UrlMixin(CatalogMemberMixin(CreateModel(SdmxCatalogItemTraits)))
      )
    )
  )
) {
  static get type() {
    return "sdmx-json";
  }

  private _csvString?: string;

  constructor(
    id: string | undefined,
    terria: Terria,
    sourceReference: BaseModel | undefined
  ) {
    super(id, terria, sourceReference);
    this.strata.set(
      automaticTableStylesStratumName,
      new TableAutomaticStylesStratum(this)
    );
  }

  get type() {
    return SdmxJsonCatalogItem.type;
  }

  @computed
  get _canExportData() {
    return isDefined(this._csvString);
  }

  @computed
  get cacheDuration() {
    return super.cacheDuration || "1d";
  }

  protected async _exportData() {
    if (isDefined(this._csvString)) {
      return {
        name: (this.name || this.uniqueId)!,
        file: new Blob([this._csvString])
      };
    }

    throw new TerriaError({
      sender: this,
      message: "No data available to download."
    });
  }

  @computed
  get canZoomTo() {
    return this.activeTableStyle.latitudeColumn !== undefined;
  }

  @computed
  get discreteTimes() {
    const automaticTableStylesStratum:
      | TableAutomaticStylesStratum
      | undefined = this.strata.get(
      automaticTableStylesStratumName
    ) as TableAutomaticStylesStratum;
    return automaticTableStylesStratum?.discreteTimes;
  }

  protected async forceLoadMetadata(): Promise<void> {
    const stratum = await SdmxJsonDataflowStratum.load(this);
    runInAction(() => {
      this.strata.set(SdmxJsonDataflowStratum.stratumName, stratum);
    });
    console.log(this.dimensions);
  }

  protected async forceLoadTableData(): Promise<string[][]> {
    await this.loadMetadata();
    if (!isDefined(this._csvString)) {
      this._csvString = await new Resource({
        url: proxyCatalogItemUrl(this, `${this.url}/data/${this.dataflowId}`),
        headers: {
          Accept: "application/vnd.sdmx.data+csv; version=1.0.0"
        }
      }).fetch();

      if (!isDefined(this._csvString)) {
        throw "ahh";
      }
    }

    return await Csv.parseString(this._csvString, true);
  }
}

StratumOrder.addLoadStratum(automaticTableStylesStratumName);
