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
  SelectableDimension,
  Dimension
} from "../SelectableDimensions";
import filterOutUndefined from "../../Core/filterOutUndefined";

const automaticTableStylesStratumName = TableAutomaticStylesStratum.stratumName;

export default class SdmxJsonCatalogItem
  extends AsyncChartableMixin(
    TableMixin(
      // Since both TableMixin & DiscretelyTimeVaryingMixin defines
      // `chartItems`, the order of mixing in is important here
      DiscretelyTimeVaryingMixin(
        UrlMixin(CatalogMemberMixin(CreateModel(SdmxCatalogItemTraits)))
      )
    )
  )
  implements SelectableDimensions {
  static get type() {
    return "sdmx-json";
  }

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
        const data = await this.downloadData();
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
  get cacheDuration() {
    return super.cacheDuration || "1d";
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

  /**
   * Disable dimension if viewing time-series and this dimenion is a time dimension OR viewing region-mapping and this dimension is for region-mapping
   */
  isDimDisabled(dim: Dimension) {
    return (
      (this.viewBy === "time" && this.timeDimensionIds.includes(dim.id!)) ||
      (this.viewBy === "region" &&
        this.regionMappedDimensionIds.includes(dim.id!))
    );
  }

  @computed get sdmxViewModeDimension(): SelectableDimension {
    return {
      id: `viewMode`,
      name: "View by",
      options: [
        { id: "region", name: "Region" },
        { id: "time", name: "Time-series" }
      ],
      selectedId: this.viewBy,
      disable:
        !Array.isArray(this.timeDimensionIds) ||
        this.timeDimensionIds.length === 0 ||
        !Array.isArray(this.regionMappedDimensionIds) ||
        this.regionMappedDimensionIds.length === 0,
      setDimensionValue: (stratumId: string, value: "time" | "region") => {
        this.setTrait(stratumId, "viewBy", value);
      }
    };
  }

  @computed
  get sdmxSelectableDimensions(): SelectableDimension[] {
    return this.dimensions.map(dim => {
      return {
        id: dim.id,
        name: dim.name,
        options: dim.options,
        selectedId: dim.selectedId,
        disable: this.isDimDisabled(dim),
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
      // do something with time
    }
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

  private async downloadData(): Promise<string[][]> {
    const csvString = await new Resource({
      url: proxyCatalogItemUrl(this, this.csvUrl),
      headers: {
        Accept: "application/vnd.sdmx.data+csv; version=1.0.0"
      }
    }).fetch();

    if (!isDefined(csvString)) {
      throw "ahh";
    }

    const columns = await Csv.parseString(csvString, true);

    // Filter colums to only include primary measure, region mapped and time dimensions
    if (isDefined(this.primaryMeasureDimenionId)) {
      let colNames = [this.primaryMeasureDimenionId];

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

        // If no filter available - just return all columns and hope for the best
      } else {
        return columns;
      }

      // Return filtered columns
      return columns.filter(col => colNames.includes(col[0]));
    }

    return columns;
  }

  protected async forceLoadTableData(): Promise<string[][]> {
    await this.loadMetadata();

    if (!isDefined(this.dataColumnMajor)) {
      return await this.downloadData();
    }

    return this.dataColumnMajor;
  }
}

StratumOrder.addLoadStratum(automaticTableStylesStratumName);
