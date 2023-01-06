import { ApiClient, fromCatalog } from "@opendatasoft/api-client";
import { Dataset } from "@opendatasoft/api-client/dist/client/types";
import i18next from "i18next";
import { computed, runInAction } from "mobx";
import ms from "ms";
import Mustache from "mustache";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import TimeInterval from "terriajs-cesium/Source/Core/TimeInterval";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import flatten from "../../../Core/flatten";
import isDefined from "../../../Core/isDefined";
import { isJsonObject, isJsonString } from "../../../Core/Json";
import TerriaError from "../../../Core/TerriaError";
import AutoRefreshingMixin from "../../../ModelMixins/AutoRefreshingMixin";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import TableMixin from "../../../ModelMixins/TableMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import TableAutomaticStylesStratum from "../../../Table/TableAutomaticStylesStratum";
import { MetadataUrlTraits } from "../../../Traits/TraitsClasses/CatalogMemberTraits";
import EnumDimensionTraits from "../../../Traits/TraitsClasses/DimensionTraits";
import OpenDataSoftCatalogItemTraits from "../../../Traits/TraitsClasses/OpenDataSoftCatalogItemTraits";
import TableColumnTraits from "../../../Traits/TraitsClasses/Table/ColumnTraits";
import TableStyleTraits from "../../../Traits/TraitsClasses/Table/StyleTraits";
import TableTimeStyleTraits from "../../../Traits/TraitsClasses/Table/TimeStyleTraits";
import CreateModel from "../../Definition/CreateModel";
import createStratumInstance from "../../Definition/createStratumInstance";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import StratumOrder from "../../Definition/StratumOrder";
import SelectableDimensions, {
  SelectableDimension
} from "../../SelectableDimensions/SelectableDimensions";
import Terria from "../../Terria";
import {
  isValidDataset,
  ValidDataset
} from "../CatalogGroups/OpenDataSoftCatalogGroup";

type PointTimeSeries = {
  samples?: number;
  minTime?: Date;
  maxTime?: Date;
  /** Interval in seconds (in between maxTime and minTime) */
  intervalSec?: number;
};

// Column name to use for OpenDataSoft Record IDs
const RECORD_ID_COL = "record_id";

export class OpenDataSoftDatasetStratum extends LoadableStratum(
  OpenDataSoftCatalogItemTraits
) {
  static stratumName = "openDataSoftDataset";

  static async load(
    catalogItem: OpenDataSoftCatalogItem
  ): Promise<OpenDataSoftDatasetStratum> {
    if (!catalogItem.url) throw "`url` must be set";

    if (!catalogItem.datasetId) throw "`datasetId` must be set";

    const client = new ApiClient({
      domain: catalogItem.url
    });

    const response = await client.get(
      fromCatalog().dataset(catalogItem.datasetId).itself()
    );

    const dataset = response.dataset;

    if (!isValidDataset(dataset))
      throw `Could not find dataset \`${catalogItem.datasetId}\``;

    // Try to retrieve information about geo-referenced (point or polygon/region) time-series
    let pointTimeSeries: PointTimeSeries[] | undefined;

    const timeField = catalogItem.timeFieldName ?? getTimeField(dataset);
    const geoPointField =
      catalogItem.geoPoint2dFieldName ?? getGeoPointField(dataset);

    if (timeField && geoPointField) {
      // Get aggregation of time values for each feature (point/polygon)
      const counts = (
        await client.get(
          fromCatalog()
            .dataset(catalogItem.datasetId)
            .records()
            .select(
              `min(${timeField}) as min_time, max(${timeField}) as max_time, count(${timeField}) as num`
            )
            .groupBy(geoPointField)
            .limit(100)
        )
      ).records;

      if (counts) {
        pointTimeSeries = counts?.reduce<PointTimeSeries[]>((agg, current) => {
          const samples = current?.record?.fields?.num as number;
          const minTime = current?.record?.fields?.min_time
            ? new Date(current?.record?.fields?.min_time)
            : undefined;
          const maxTime = current?.record?.fields?.max_time
            ? new Date(current?.record?.fields?.max_time)
            : undefined;

          let intervalSec: number | undefined;

          if (minTime && maxTime && samples) {
            intervalSec =
              (maxTime.getTime() - minTime.getTime()) / (samples * 1000);
          }

          agg.push({
            samples,
            minTime,
            maxTime,
            intervalSec
          });
          return agg;
        }, []);
      }
    }

    return new OpenDataSoftDatasetStratum(
      catalogItem,
      dataset,
      pointTimeSeries
    );
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new OpenDataSoftDatasetStratum(
      model as OpenDataSoftCatalogItem,
      this.dataset,
      this.pointTimeSeries
    ) as this;
  }

  constructor(
    private readonly catalogItem: OpenDataSoftCatalogItem,
    private readonly dataset: ValidDataset,
    private readonly pointTimeSeries?: PointTimeSeries[]
  ) {
    super();
  }

  @computed get name() {
    return this.dataset.metas?.default?.title ?? this.dataset.dataset_id;
  }

  @computed get description() {
    return this.dataset.metas?.default?.description;
  }

  @computed get metadataUrls() {
    return [
      createStratumInstance(MetadataUrlTraits, {
        title: i18next.t("models.openDataSoft.viewDatasetPage"),
        url: `${this.catalogItem.url}/explore/dataset/${this.dataset.dataset_id}/information/`
      })
    ];
  }

  /** Find field to visualise by default (i.e. colorColumn)
   *  It will find the field in this order:
   * - First of type "double"
   * - First of type "int"
   * - First of type "text"
   */
  @computed get colorFieldName() {
    return (
      this.usefulFields.find((f) => f.type === "double") ??
      this.usefulFields.find((f) => f.type === "int") ??
      this.usefulFields.find((f) => f.type === "text")
    )?.name;
  }

  @computed get geoPoint2dFieldName() {
    return getGeoPointField(this.dataset);
  }

  @computed get timeFieldName() {
    return getTimeField(this.dataset);
  }

  @computed get regionFieldName() {
    // Find first field which matches a region type
    return this.dataset.fields?.find(
      (f) =>
        this.catalogItem.matchRegionProvider(f.name)?.regionType ||
        this.catalogItem.matchRegionProvider(f.label)?.regionType
    )?.name;
  }

  @computed get recordsCount(): number | undefined {
    return this.dataset.metas?.default?.records_count;
  }

  /** Number of features in timeseries */
  @computed get pointsCount() {
    return this.pointTimeSeries?.length;
  }

  /** Get the maximum number of samples for a given point (or sensor) */
  @computed get maxPointSamples() {
    if (!this.pointTimeSeries) return;
    return Math.max(...this.pointTimeSeries.map((p) => p.samples ?? 0));
  }

  /** Should we select all fields (properties) in each record?
   * - Less than 10 fields
   * - Less than 10000 records
   * - There is no colorFieldName (no suitable default field - eg number - to visualise)
   * - There is no geoPoint and no time field
   *
   */
  @computed get selectAllFields() {
    return (
      (this.dataset.fields?.length ?? 0) <= 10 ||
      (isDefined(this.recordsCount) && this.recordsCount < 10000) ||
      !this.catalogItem.colorFieldName ||
      !(this.catalogItem.geoPoint2dFieldName || this.catalogItem.timeFieldName)
    );
  }

  @computed get selectFields() {
    if (this.selectAllFields) {
      // Filter out fields with GeoJSON and fields which could be lat/lon as all point information is provided with field types "geo_point" (See `getGeoPointField()`)
      return filterOutUndefined(
        this.dataset.fields
          ?.filter(
            (f) =>
              f.type !== "geo_shape" &&
              !["lat", "lon", "long", "latitude", "longitude"].includes(
                f.name?.toLowerCase() ?? ""
              )
          )
          .map((f) => f.name) ?? []
      ).join(", ");
    }

    return filterOutUndefined([
      this.catalogItem.timeFieldName,
      // If aggregating time - average color field
      this.aggregateTime
        ? `avg(${this.catalogItem.colorFieldName}) as ${this.catalogItem.colorFieldName}`
        : this.catalogItem.colorFieldName,
      // Otherwise use region field or geopoint field (in that order)
      this.catalogItem.geoPoint2dFieldName,
      this.catalogItem.regionFieldName
    ]).join(", ");
  }

  @computed get groupByFields() {
    // If aggregating time - use RANGE group by clause to average values over a date range (eg `aggregateTime = "1 day"`)
    // See https://help.opendatasoft.com/apis/ods-search-v2/#group-by-clause
    if (this.aggregateTime && this.timeFieldName && this.geoPoint2dFieldName) {
      return `${this.geoPoint2dFieldName},RANGE(${this.timeFieldName}, ${this.aggregateTime}) as ${this.timeFieldName}`;
    }
  }

  // Hide geopoint column
  @computed get geoPoint2dColumn() {
    if (this.catalogItem.geoPoint2dFieldName) {
      return createStratumInstance(TableColumnTraits, {
        name: this.catalogItem.geoPoint2dFieldName,
        type: "hidden"
      });
    }
  }

  // Set region column type
  @computed get regionColumn() {
    if (this.catalogItem.regionFieldName) {
      return createStratumInstance(TableColumnTraits, {
        name: this.catalogItem.regionFieldName,
        type: "region"
      });
    }
  }

  // Set colour column type and title
  @computed get colorColumn() {
    if (!this.catalogItem.colorFieldName) return;

    const f = this.dataset.fields?.find(
      (f) => f.name === this.catalogItem.colorFieldName
    );
    if (f) {
      return createStratumInstance(TableColumnTraits, {
        name: f.name,
        title: f.label,
        type: f.type === "double" || f.type === "int" ? "scalar" : undefined
      });
    }
  }

  // Set time column type and title
  @computed get timeColumn() {
    if (!this.catalogItem.timeFieldName) return;

    const f = this.dataset.fields?.find(
      (f) => f.name === this.catalogItem.timeFieldName
    );
    if (f) {
      return createStratumInstance(TableColumnTraits, {
        name: f.name,
        title: f.label,
        type: "time"
      });
    }
  }

  // Set all other column types and title
  @computed get otherColumns() {
    return (
      this.dataset.fields
        ?.filter(
          (f) =>
            f.name !== this.catalogItem.timeFieldName &&
            f.name !== this.catalogItem.colorFieldName &&
            f.name !== this.catalogItem.regionFieldName
        )
        ?.map((f) =>
          createStratumInstance(TableColumnTraits, {
            name: f.name,
            title: f.label,
            type: isIdField(f.name) ? "hidden" : undefined
          })
        ) ?? []
    );
  }

  @computed get columns() {
    return filterOutUndefined([
      this.timeColumn,
      this.colorColumn,
      this.regionColumn,
      this.geoPoint2dColumn,
      ...(!this.selectAllFields ? [] : this.otherColumns)
    ]);
  }

  /** Set default style traits for points (lat/lon) and time */
  @computed
  get defaultStyle() {
    return createStratumInstance(TableStyleTraits, {
      regionColumn: this.regionFieldName,
      latitudeColumn:
        this.catalogItem.geoPoint2dFieldName &&
        !this.catalogItem.regionFieldName
          ? "lat"
          : undefined,
      longitudeColumn:
        this.catalogItem.geoPoint2dFieldName &&
        !this.catalogItem.regionFieldName
          ? "lon"
          : undefined,

      time: createStratumInstance(TableTimeStyleTraits, {
        // If we are viewing a timeseries with only 1 sample per point - spreadStart/EndTime
        spreadStartTime:
          isDefined(this.maxPointSamples) && this.maxPointSamples === 1,
        spreadFinishTime:
          isDefined(this.maxPointSamples) && this.maxPointSamples === 1,
        timeColumn: this.timeColumn?.name,
        idColumns: this.catalogItem.geoPoint2dFieldName
          ? ["lat", "lon"]
          : undefined
      })
    });
  }

  /** Try to find a sensible currentTime based on the latest timeInterval which has values for all points
   * This is biased for real-time sensor data - where we would usually want to see the latest values.
   * As we are fetching the last 1000 records, there may be time intervals which are incomplete. Ideally we want to see all sensors with some data by default.
   */
  @computed
  get currentTime() {
    if (!this.pointTimeSeries && this.catalogItem.geoPoint2dFieldName) return;

    const lastDate =
      this.catalogItem.activeTableStyle?.timeColumn?.valuesAsJulianDates
        .maximum;

    if (
      !this.catalogItem.activeTableStyle.timeIntervals ||
      !this.catalogItem.activeTableStyle.rowGroups ||
      !lastDate
    )
      return;

    // Group all time intervals for each row group (each Point feature)
    // This calculates the start/stop dates for each row group
    const groupIntervals = this.catalogItem.activeTableStyle.rowGroups.map(
      ([id, rows]) => {
        let start: JulianDate | undefined;
        let stop: JulianDate | undefined;

        rows.forEach((rowId) => {
          const interval =
            this.catalogItem.activeTableStyle.timeIntervals![rowId] ??
            undefined;

          if (interval?.start) {
            start =
              !start || JulianDate.lessThan(interval.start, start)
                ? interval.start
                : start;
          }

          if (interval?.stop) {
            stop =
              !stop || JulianDate.lessThan(stop, interval.stop)
                ? interval.stop
                : stop;
          }
        });

        return new TimeInterval({ start, stop });
      }
    );

    // Find intersection of groupIntervals - this will roughly estimate the time interval which is the "most complete" - that is to say, the time interval which has the most groups (or points) with data
    if (groupIntervals.length > 0) {
      const totalInterval = groupIntervals.reduce<TimeInterval | undefined>(
        (intersection, current) =>
          intersection
            ? TimeInterval.intersect(intersection, current)
            : current,
        undefined
      );

      // If intersection is found - use last date
      if (
        totalInterval &&
        !totalInterval.isEmpty &&
        !JulianDate.lessThan(lastDate, totalInterval.stop)
      ) {
        return totalInterval.stop.toString();
      }
    }

    // If no intersection is found - use last date for entire dataset
    return lastDate.toString();
  }

  @computed get refreshInterval() {
    if (!this.catalogItem.refreshIntervalTemplate) return;

    try {
      const string = Mustache.render(
        this.catalogItem.refreshIntervalTemplate,
        this.dataset
      );
      if (isJsonString(string)) {
        const timeInSeconds = (ms(string) || 0) / 1000;
        // Only return refreshInterval if less than an hour
        if (timeInSeconds < 60 * 60) {
          return timeInSeconds;
        }
      }
    } catch (e) {
      TerriaError.from(
        e,
        `Failed to parse refreshInterval from template ${this.catalogItem.refreshIntervalTemplate}`
      ).log();
    }
  }

  /** Get fields with useful information (for visualisation). Eg numbers, text, not IDs, not region... */
  @computed get usefulFields() {
    return (
      this.dataset.fields?.filter(
        (f) =>
          ["double", "int", "text"].includes(f.type ?? "") &&
          !["lat", "lon", "long", "latitude", "longitude"].includes(
            f.name?.toLowerCase() ?? ""
          ) &&
          !isIdField(f.name) &&
          !isIdField(f.label) &&
          f.name !== this.catalogItem.regionFieldName &&
          !this.catalogItem.matchRegionProvider(f.name)?.regionType &&
          !this.catalogItem.matchRegionProvider(f.label)?.regionType
      ) ?? []
    );
  }

  /** Convert usefulFields to a Dimension (which gets turned into a SelectableDimension in OpenDataSoftCatalogItem).
   * This means we can chose which field to "select" when downloading data.
   */
  @computed get availableFields() {
    if (!this.selectAllFields)
      return createStratumInstance(EnumDimensionTraits, {
        id: "available-fields",
        name: "Fields",
        selectedId: this.catalogItem.colorFieldName,
        options: this.usefulFields.map((f) => ({
          id: f.name,
          name: f.label,
          value: undefined
        }))
      });
  }

  @computed get activeStyle() {
    return this.catalogItem.colorFieldName;
  }
}

/** Column is hidden if the name starts or ends with `id` */
function isIdField(...names: (string | undefined)[]) {
  return names
    .filter(isDefined)
    .reduce<boolean>(
      (hide, name) =>
        hide ||
        name.toLowerCase().startsWith("id") ||
        name.toLowerCase().endsWith("id"),
      false
    );
}

function getGeoPointField(dataset: Dataset) {
  return dataset.fields?.find((f) => f.type === "geo_point_2d")?.name;
}

function getTimeField(dataset: Dataset) {
  return dataset.fields?.find((f) => f.type === "datetime")?.name;
}

StratumOrder.addLoadStratum(OpenDataSoftDatasetStratum.stratumName);

export default class OpenDataSoftCatalogItem
  extends TableMixin(
    AutoRefreshingMixin(
      UrlMixin(CatalogMemberMixin(CreateModel(OpenDataSoftCatalogItemTraits)))
    )
  )
  implements SelectableDimensions
{
  static readonly type = "opendatasoft-item";

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

  get type() {
    return OpenDataSoftCatalogItem.type;
  }

  protected async forceLoadMetadata(): Promise<void> {
    if (!this.strata.has(OpenDataSoftDatasetStratum.stratumName)) {
      const stratum = await OpenDataSoftDatasetStratum.load(this);
      runInAction(() => {
        this.strata.set(OpenDataSoftDatasetStratum.stratumName, stratum);
      });
    }
  }

  @computed get apiClient() {
    return new ApiClient({
      domain: this.url
    });
  }

  protected async forceLoadTableData() {
    if (!this.datasetId || !this.url) return [];

    let data: string[][] = [];

    let q = fromCatalog().dataset(this.datasetId).records().limit(100);

    // If fetching time - order records by latest time
    if (this.timeFieldName) q = q.orderBy(`${this.timeFieldName} DESC`);

    if (this.selectFields) {
      q = q.select(this.selectFields);
    }

    if (this.groupByFields) {
      q = q.groupBy(this.groupByFields);
    }

    const stratum = this.strata.get(OpenDataSoftDatasetStratum.stratumName) as
      | OpenDataSoftDatasetStratum
      | undefined;
    // Fetch maximum of 1000 records
    const recordsToFetch = Math.min(1000, stratum?.recordsCount ?? 1000);

    // Get 1000 records (in chunks of 100)
    const records = flatten(
      await Promise.all(
        new Array(Math.ceil(recordsToFetch / 100))
          .fill(0)
          .map(
            async (v, index) =>
              (await this.apiClient.get(q.offset(index * 100))).records ?? []
          )
      )
    );

    if (records && records.length > 0) {
      // Set up columns object
      const cols: { [key: string]: string[] } = {};

      cols[RECORD_ID_COL] = new Array(records.length).fill("");

      if (this.geoPoint2dFieldName) {
        cols["lat"] = new Array(records.length).fill("");
        cols["lon"] = new Array(records.length).fill("");
      }
      if (this.timeFieldName) {
        cols[this.timeFieldName] = new Array(records.length).fill("");
      }

      records.forEach((record, index) => {
        if (!record.record?.id) return;
        // Manually add Record ID
        cols[RECORD_ID_COL][index] = record.record?.id;
        // Go through each field and set column value
        Object.entries(record.record?.fields ?? {}).forEach(
          ([field, value]) => {
            // geoPoint2dFieldName will return a JSON object - spilt lat/lon columns
            if (field === this.geoPoint2dFieldName && isJsonObject(value)) {
              cols.lat[index] = `${value.lat}` ?? "";
              cols.lon[index] = `${value.lon}` ?? "";
            } else {
              // Copy current field into columns object
              if (!Array.isArray(cols[field])) {
                cols[field] = new Array(records.length).fill("");
              }
              cols[field][index] = `${value}`;
            }
          }
        );
      });

      // Munge into dataColumnMajor format
      data = Object.entries(cols).map(([field, values]) => [field, ...values]);
    }

    return data;
  }

  refreshData(): void {
    this.forceLoadMapItems();
  }

  // Convert availableFields DimensionTraits to SelectableDimension
  @computed get availableFieldsDimension(): SelectableDimension | undefined {
    if (this.availableFields?.options?.length ?? 0 > 0) {
      return {
        id: this.availableFields.id,
        name: this.availableFields.name,
        selectedId: this.availableFields.selectedId,
        options: this.availableFields.options,
        setDimensionValue: async (
          strataId: string,
          selectedId: string | undefined
        ) => {
          this.setTrait(strataId, "colorFieldName", selectedId);
          (await this.loadMapItems()).throwIfError();
        }
      };
    }
  }

  @computed
  get selectableDimensions() {
    return filterOutUndefined([
      this.availableFieldsDimension,
      ...super.selectableDimensions.filter(
        (s) => !this.availableFieldsDimension || s.id !== "activeStyle"
      )
    ]);
  }
}

StratumOrder.addLoadStratum(TableAutomaticStylesStratum.stratumName);
