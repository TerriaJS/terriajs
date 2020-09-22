import { computed, runInAction } from "mobx";
import Resource from "terriajs-cesium/Source/Core/Resource";
import filterOutUndefined from "../../Core/filterOutUndefined";
import isDefined from "../../Core/isDefined";
import TerriaError from "../../Core/TerriaError";
import AsyncChartableMixin from "../../ModelMixins/AsyncChartableMixin";
import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import TableMixin from "../../ModelMixins/TableMixin";
import UrlMixin from "../../ModelMixins/UrlMixin";
import Csv from "../../Table/Csv";
import TableAutomaticStylesStratum from "../../Table/TableAutomaticStylesStratum";
import SdmxCatalogItemTraits from "../../Traits/SdmxCatalogItemTraits";
import CreateModel from "../CreateModel";
import { BaseModel } from "../Model";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import SelectableDimensions, {
  Dimension,
  SelectableDimension
} from "../SelectableDimensions";
import StratumOrder from "../StratumOrder";
import Terria from "../Terria";
import { SdmxJsonDataflowStratum } from "./SdmxJsonDataflowStratum";

const automaticTableStylesStratumName = TableAutomaticStylesStratum.stratumName;

export default class SdmxJsonCatalogItem
  extends AsyncChartableMixin(
    TableMixin(UrlMixin(CatalogMemberMixin(CreateModel(SdmxCatalogItemTraits))))
  )
  implements SelectableDimensions {
  static get type() {
    return "sdmx-json";
  }

  private _currentCsvUrl: string | undefined;

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
  }

  protected async forceLoadMetadata(): Promise<void> {
    // Load SdmxJsonDataflowStratum if needed
    if (!this.strata.has(SdmxJsonDataflowStratum.stratumName)) {
      const stratum = await SdmxJsonDataflowStratum.load(this);
      runInAction(() => {
        this.strata.set(SdmxJsonDataflowStratum.stratumName, stratum);
      });
    }
  }

  get type() {
    return SdmxJsonCatalogItem.type;
  }

  @computed
  get cacheDuration() {
    return super.cacheDuration || "1d";
  }

  @computed
  get canZoomTo() {
    return this.activeTableStyle.latitudeColumn !== undefined;
  }

  /**
   * Disable dimension if viewing time-series and this dimenion is a time dimension OR viewing region-mapping and this dimension is for region-mapping
   */
  isDimDisabled(dim: Dimension) {
    const disable =
      (this.viewBy === "time" && this.timeDimensionIds.includes(dim.id!)) ||
      (this.viewBy === "region" &&
        this.regionMappedDimensionIds.includes(dim.id!));
    return disable;
  }

  /**
   * View by Selectable dimension allows user to select viewby region or time-series.
   */
  @computed get sdmxViewModeDimension(): SelectableDimension {
    return {
      id: `viewMode`,
      name: "View by",
      options: [
        { id: "region", name: "Region" },
        { id: "time", name: "Time-series" }
      ],
      selectedId: this.viewBy,
      // Disable if there aren't time dimensions and region-mapped dimensions
      disable:
        !Array.isArray(this.timeDimensionIds) ||
        this.timeDimensionIds.length === 0 ||
        !Array.isArray(this.regionMappedDimensionIds) ||
        this.regionMappedDimensionIds.length === 0,
      setDimensionValue: (stratumId: string, value: "time" | "region") => {
        this.setTrait(stratumId, "viewBy", value);
        this.forceLoadMapItems(true);
        this.forceLoadChartItems(true);
      }
    };
  }

  /**
   * Map SdmxDataflowStratum.dimensions to selectable dimensions
   */
  @computed
  get sdmxSelectableDimensions(): SelectableDimension[] {
    return this.dimensions.map(dim => {
      return {
        id: dim.id,
        name: dim.name,
        options: dim.options,
        selectedId: dim.selectedId,
        allowUndefined: dim.allowUndefined,
        disable: this.isDimDisabled(dim) || dim.disable,
        setDimensionValue: (stratumId: string, value: string) => {
          let dimensionTraits = this.dimensions?.find(
            sdmxDim => sdmxDim.id === dim.id
          );
          if (!isDefined(dimensionTraits)) {
            dimensionTraits = this.addObject(stratumId, "dimensions", dim.id!)!;
          }

          dimensionTraits.setTrait(stratumId, "selectedId", value);
          this.forceLoadMapItems(true);
          this.forceLoadChartItems(true);
        }
      };
    });
  }

  @computed
  get selectableDimensions(): SelectableDimension[] {
    return filterOutUndefined([
      this.sdmxViewModeDimension,
      ...this.sdmxSelectableDimensions,
      this.regionColumnDimensions,
      this.regionProviderDimensions
    ]);
  }

  /**
   * Returns string compliant with the KeyType defined in the SDMX WADL (period separated dimension values) - dimension order is very important!
   */
  @computed get dataKey(): string {
    const max = this.dimensions.length;
    // We must sort the dimensions by position as traits lose their order across strata
    return (
      this.dimensions
        .slice()
        .sort(
          (a, b) =>
            (isDefined(a.position) ? a.position : max) -
            (isDefined(b.position) ? b.position : max)
        )
        // If a dimension is disabled, use empty string (which is wildcard)
        .map(dim => (!this.isDimDisabled(dim) ? dim.selectedId : ""))
        .join(".")
    );
  }

  @computed
  get csvUrl(): string {
    if (this.viewBy === "time") {
      // do something with time?
      // Currently all time slices are returned at once - which is probably fine for the moment
    }
    return `${this.url}/data/${this.dataflowId}/${this.dataKey}`;
  }

  @computed
  get shortReport() {
    if (
      !isDefined(this.dataColumnMajor) ||
      this.isLoadingMapItems ||
      this.isLoadingChartItems
    )
      return;

    return this.dataColumnMajor.length === 0 ? "No data available" : undefined;
  }

  /**
   * Even though this is Sdmx**Json**CatalogItem, we download sdmx-csv.
   */
  private async downloadData(): Promise<string[][] | undefined> {
    // FIXME: This is a bad way of handling re-loading the same data
    if (
      !isDefined(this.regionProviderList) ||
      this._currentCsvUrl === this.csvUrl
    )
      return this.dataColumnMajor;

    this._currentCsvUrl = this.csvUrl;

    let columns: string[][] = [];

    try {
      const csvString = await new Resource({
        url: proxyCatalogItemUrl(this, this.csvUrl),
        headers: {
          Accept: "application/vnd.sdmx.data+csv; version=1.0.0"
        }
      }).fetch();

      if (!isDefined(csvString)) {
        throw new TerriaError({
          title: `Could not load SDMX CSV`,
          message: `Invalid response from ${this.csvUrl}`
        });
      }

      columns = await Csv.parseString(csvString, true);
    } catch (error) {
      console.log(`Could not load sdmx-csv:`);
      console.log(error);
    }

    // Filter colums to only include primary measure, region mapped and time dimensions
    if (isDefined(this.primaryMeasureDimensionId)) {
      let colNames = [this.primaryMeasureDimensionId];

      // If viewing region-mapping, add region-map dimension columns
      if (
        this.viewBy === "region" &&
        this.regionMappedDimensionIds.length > 0
      ) {
        colNames.push(...this.regionMappedDimensionIds);
        colNames.push(...this.timeDimensionIds);

        // If viewing time-series, add time dimension column
      } else if (this.viewBy === "time" && this.timeDimensionIds.length > 0) {
        colNames.push(...this.timeDimensionIds);
        // If no filter available - just use all columns and hope for the best
      } else {
        console.log(
          `WARNING: no time or region dimensions are found for ${this.name}, therefore styling may be unpredictable!`
        );
        return columns;
      }

      return columns.filter(col => colNames.includes(col[0]));
    } else {
      console.log(
        `WARNING: no primary measure dimension was defined for ${this.name}, therefore styling may be unpredictable!`
      );
      return columns;
    }
  }
  protected async forceLoadTableData(): Promise<string[][]> {
    await this.loadMetadata();

    return (await this.downloadData()) || [];
  }
}

StratumOrder.addLoadStratum(automaticTableStylesStratumName);
