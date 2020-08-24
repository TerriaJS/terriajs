import i18next from "i18next";
import {
  runInAction,
  computed,
  IReactionDisposer,
  autorun,
  reaction
} from "mobx";
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
import SelectableDimensions, {
  SelectableDimension
} from "../SelectableDimensions";
import filterOutUndefined from "../../Core/filterOutUndefined";

const automaticTableStylesStratumName = TableAutomaticStylesStratum.stratumName;

export default class SdmxJsonCatalogItem
  extends AsyncChartableMixin(
    TableMixin(
      // Since both TableMixin & DiscretelyTimeVaryingMixin defines
      // `chartItems`, the order of mixing in is important here
      DiscretelyTimeVaryingMixin(
        ExportableMixin(
          UrlMixin(CatalogMemberMixin(CreateModel(SdmxCatalogItemTraits)))
        )
      )
    )
  )
  implements SelectableDimensions {
  static get type() {
    return "sdmx-json";
  }

  private _csvString?: string;
  private csvDownloadDisposer: IReactionDisposer;

  constructor(
    id: string | undefined,
    terria: Terria,
    sourceReference: BaseModel | undefined
  ) {
    super(id, terria, sourceReference);
    this.strata.set(
      TableAutomaticStylesStratum.stratumName,
      new TableAutomaticStylesStratum(this)
    );

    this.csvDownloadDisposer = reaction(
      () => this.csvUrl,
      async () => {
        const data = await Csv.parseString(await this.downloadCsv(), true);
        runInAction(() => {
          this.dataColumnMajor = data;
        });
      }
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

  @computed
  get sdmxSelectableDimensions(): SelectableDimension[] {
    return this.dimensions.map(dim => {
      return {
        id: dim.id,
        name: dim.name,
        options: dim.options,
        selectedId: dim.selectedId,
        setDimensionValue: (stratumId: string, value: string) => {
          let dimensionTraits = this.dimensions?.find(
            sdmxDim => sdmxDim.id === dim.id
          );
          if (!isDefined(dimensionTraits)) {
            dimensionTraits = this.addObject(stratumId, "dimensions", dim.id!)!;
          }

          dimensionTraits.setTrait(stratumId, "selectedId", value);
        }
      };
    });
  }

  @computed
  get selectableDimensions(): SelectableDimension[] {
    return filterOutUndefined([
      ...this.sdmxSelectableDimensions,
      this.regionColumnDimensions,
      this.regionProviderDimensions
    ]);
  }

  // A string compliant with the KeyType defined in the SDMX WADL (period separated dimension values) - dimension order is very important!
  @computed get dataKey(): string {
    const max = this.dimensions.length;
    // We must sort the dimensions by position as traits lose their order across strata
    return this.dimensions
      .slice()
      .sort(
        (a, b) =>
          (isDefined(a.position) ? a.position : max) -
          (isDefined(b.position) ? b.position : max)
      )
      .map(dim => dim.selectedId)
      .join(".");
  }

  @computed
  get csvUrl(): string {
    return `${this.url}/data/${this.dataflowId}/${this.dataKey}`;
  }

  protected async forceLoadMetadata(): Promise<void> {
    if (!isDefined(this.strata.get(SdmxJsonDataflowStratum.stratumName))) {
      const stratum = await SdmxJsonDataflowStratum.load(this);
      runInAction(() => {
        this.strata.set(SdmxJsonDataflowStratum.stratumName, stratum);
      });
    }
  }

  private async downloadCsv(): Promise<string> {
    this._csvString = await new Resource({
      url: proxyCatalogItemUrl(this, this.csvUrl),
      headers: {
        Accept: "application/vnd.sdmx.data+csv; version=1.0.0"
      }
    }).fetch();

    if (!isDefined(this._csvString)) {
      throw "ahh";
    }

    return this._csvString;
  }

  protected async forceLoadTableData(): Promise<string[][]> {
    await this.loadMetadata();

    let csv = this._csvString;
    if (!isDefined(csv)) {
      csv = await this.downloadCsv();
    }

    return await Csv.parseString(csv, true);
  }
}

StratumOrder.addLoadStratum(automaticTableStylesStratumName);
