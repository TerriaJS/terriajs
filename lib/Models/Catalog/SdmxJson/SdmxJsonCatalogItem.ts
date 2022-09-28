import i18next from "i18next";
import { computed, runInAction } from "mobx";
import RequestErrorEvent from "terriajs-cesium/Source/Core/RequestErrorEvent";
import Resource from "terriajs-cesium/Source/Core/Resource";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import isDefined from "../../../Core/isDefined";
import TerriaError, { TerriaErrorSeverity } from "../../../Core/TerriaError";
import TableMixin from "../../../ModelMixins/TableMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import Csv from "../../../Table/Csv";
import TableAutomaticStylesStratum from "../../../Table/TableAutomaticStylesStratum";
import SdmxCatalogItemTraits from "../../../Traits/TraitsClasses/SdmxCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import { BaseModel } from "../../Definition/Model";
import StratumOrder from "../../Definition/StratumOrder";
import SelectableDimensions, {
  filterEnums,
  SelectableDimension
} from "../../SelectableDimensions/SelectableDimensions";
import Terria from "../../Terria";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import { SdmxJsonDataflowStratum } from "./SdmxJsonDataflowStratum";
import { sdmxErrorString, SdmxHttpErrorCodes } from "./SdmxJsonServerStratum";

export default class SdmxJsonCatalogItem
  extends TableMixin(UrlMixin(CreateModel(SdmxCatalogItemTraits)))
  implements SelectableDimensions
{
  static get type() {
    return "sdmx-json";
  }

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

    await this.loadRegionProviderList();
  }

  get type() {
    return SdmxJsonCatalogItem.type;
  }

  @computed
  get cacheDuration() {
    return super.cacheDuration || "1d";
  }

  /**
   * Map SdmxDimensionTraits to SelectableDimension
   */
  @computed
  get sdmxSelectableDimensions(): SelectableDimension[] {
    return this.dimensions.map((dim) => {
      return {
        id: dim.id,
        name: dim.name,
        options: dim.options,
        selectedId: dim.selectedId,
        allowUndefined: dim.allowUndefined,
        disable:
          dim.disable ||
          this.columns.find((col) => col.name === dim.id)?.type === "region",
        setDimensionValue: async (
          stratumId: string,
          value: string | undefined
        ) => {
          let dimensionTraits = this.dimensions?.find(
            (sdmxDim) => sdmxDim.id === dim.id
          );
          if (!isDefined(dimensionTraits)) {
            dimensionTraits = this.addObject(stratumId, "dimensions", dim.id!)!;
          }

          dimensionTraits.setTrait(stratumId, "selectedId", value);

          (await this.loadMapItems()).raiseError(this.terria);
        }
      };
    });
  }

  @computed
  get selectableDimensions(): SelectableDimension[] {
    return filterOutUndefined([
      ...super.selectableDimensions.filter(
        (d) => d.id !== this.styleDimensions?.id
      ),
      ...this.sdmxSelectableDimensions
    ]);
  }

  /**
   * Returns base URL (from traits), as SdmxJsonCatalogItem will override `url` property with SDMX Data request
   */
  @computed
  get baseUrl(): string | undefined {
    return super.url;
  }

  @computed
  get url() {
    if (!super.url) return;

    // Get dataKey - this is used to filter dataflows by dimension values - it must be compliant with the KeyType defined in the SDMX WADL (period separated dimension values) - dimension order is very important!
    // We must sort the dimensions by position as traits lose their order across strata

    const dataKey = this.dimensions
      .slice()
      .sort(
        (a, b) =>
          (isDefined(a.position) ? a.position : this.dimensions.length) -
          (isDefined(b.position) ? b.position : this.dimensions.length)
      )
      // If a dimension is disabled, use empty string (which is wildcard)
      .map((dim) =>
        !dim.disable &&
        this.columns.find((col) => col.name === dim.id)?.type !== "region"
          ? dim.selectedId
          : ""
      )
      .join(".");

    return `${super.url}/data/${this.dataflowId}/${dataKey}`;
  }

  protected async forceLoadTableData() {
    if (!this.url) return;

    try {
      const csvString = await new Resource({
        url: proxyCatalogItemUrl(this, this.url),
        headers: {
          Accept: "application/vnd.sdmx.data+csv; version=1.0.0"
        }
      }).fetch();

      if (!isDefined(csvString)) {
        throw new TerriaError({
          title: i18next.t("models.sdmxCatalogItem.loadDataErrorTitle"),
          message: i18next.t(
            "models.sdmxCatalogItem.loadDataErrorMessage",
            this
          )
        });
      }

      return await Csv.parseString(csvString, true);
    } catch (error) {
      if (
        error instanceof RequestErrorEvent &&
        typeof error.response === "string"
      ) {
        // If no results and we have selcetable dimensions, give message regarding dimensions
        // This message will include values for each selectable dimension
        if (
          error.statusCode === SdmxHttpErrorCodes.NoResults &&
          this.selectableDimensions.length > 0
        ) {
          throw new TerriaError({
            message: i18next.t(
              "models.sdmxCatalogItem.noResultsWithDimensions",
              {
                dimensions: filterEnums(this.selectableDimensions)
                  .filter((dim) => !dim.disable && dim.options?.length !== 1)
                  .map(
                    (dim) =>
                      // Format string into `${dimenion name} = ${dimenion selected value}
                      `- ${dim.name} = \`${
                        dim.options?.find(
                          (option) => option.id === dim.selectedId
                        )?.name ?? dim.selectedId
                      }\``
                  )
                  .join("\n")
              }
            ),
            title: i18next.t("models.sdmxCatalogItem.loadDataErrorTitle", this),
            severity: TerriaErrorSeverity.Warning,
            importance: 1,
            overrideRaiseToUser: true
          });
        }
        throw new TerriaError({
          message: sdmxErrorString.has(error.statusCode)
            ? `${sdmxErrorString.get(error.statusCode)}: ${error.response}`
            : `${error.response}`,
          title: i18next.t("models.sdmxCatalogItem.loadDataErrorTitle", this)
        });
      } else {
        throw TerriaError.from(error, {
          message: i18next.t("models.sdmxCatalogItem.loadDataErrorTitle", this)
        });
      }
    }
  }
}

StratumOrder.addLoadStratum(TableAutomaticStylesStratum.stratumName);
