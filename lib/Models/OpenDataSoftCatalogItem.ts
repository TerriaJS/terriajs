import { ApiClient, fromCatalog, Query } from "@opendatasoft/api-client";
import { Dataset } from "@opendatasoft/api-client/dist/client/types";
import { computed, runInAction } from "mobx";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import TimeInterval from "terriajs-cesium/Source/Core/TimeInterval";
import URI from "urijs";
import filterOutUndefined from "../Core/filterOutUndefined";
import flatten from "../Core/flatten";
import isDefined from "../Core/isDefined";
import { isJsonObject } from "../Core/Json";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import TableMixin from "../ModelMixins/TableMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import Csv from "../Table/Csv";
import TableAutomaticStylesStratum from "../Table/TableAutomaticStylesStratum";
import DimensionTraits from "../Traits/DimensionTraits";
import OpenDataSoftCatalogItemTraits from "../Traits/OpenDataSoftCatalogItemTraits";
import TableColumnTraits from "../Traits/TableColumnTraits";
import TableStyleTraits from "../Traits/TableStyleTraits";
import TableTimeStyleTraits from "../Traits/TableTimeStyleTraits";
import CreateModel from "./CreateModel";
import createStratumInstance from "./createStratumInstance";
import LoadableStratum from "./LoadableStratum";
import { BaseModel } from "./Model";
import { isValidDataset, ValidDataset } from "./OpenDataSoftCatalogGroup";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import SelectableDimensions from "./SelectableDimensions";
import StratumOrder from "./StratumOrder";
import Terria from "./Terria";

type PointTimeSeries = {
  samples?: number;
  minTime?: Date;
  maxTime?: Date;
  intervalSec?: number;
};

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

    const dataset = (
      await client.get(
        fromCatalog()
          .dataset(catalogItem.datasetId)
          .itself()
      )
    ).dataset;

    if (!isValidDataset(dataset))
      throw `Could not find dataset \`${catalogItem.datasetId}\``;

    let pointTimeSeries: PointTimeSeries[] | undefined;

    const timeField = catalogItem.timeFieldName ?? getTimeField(dataset);
    const geoPointField =
      catalogItem.geoPoint2dFieldName ?? getGeoPointField(dataset);

    if (timeField && geoPointField) {
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

  /** Find field to visualise by default (i.e. colorColumn)
   *  It will find the field in this order:
   * - First of type "double"
   * - First of type "int"
   * - First of type "text"
   */
  @computed get colorFieldName() {
    return (
      this.usefulFields.find(f => f.type === "double") ??
      this.usefulFields.find(f => f.type === "int") ??
      this.usefulFields.find(f => f.type === "text")
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
      f =>
        this.catalogItem.matchRegionType(f.name) ||
        this.catalogItem.matchRegionType(f.label)
    )?.name;
  }

  @computed get recordsCount() {
    return this.pointTimeSeries?.reduce<number>(
      (total, current) => total + (current.samples ?? 0),
      0
    );
  }

  @computed get pointsCount() {
    return this.pointTimeSeries?.length;
  }

  /** Get the maximum number of samples for a given point (or sensor) */
  @computed get maxPointSamples() {
    if (!this.pointTimeSeries) return;
    return Math.max(...this.pointTimeSeries.map(p => p.samples ?? 0));
  }

  @computed get selectAllFields() {
    return (
      (this.dataset.fields?.length ?? 0) <= 10 ||
      (isDefined(this.recordsCount) && this.recordsCount < 10000) ||
      !this.catalogItem.colorFieldName ||
      !(this.catalogItem.geoPoint2dFieldName || this.catalogItem.timeFieldName)
    );
  }

  /** Use records API */
  @computed get useRecordsApi() {
    return (
      !this.recordsCount ||
      this.recordsCount > 20000 ||
      (isDefined(this.maxPointSamples) && this.maxPointSamples < 5000) ||
      (isDefined(this.pointsCount) && this.pointsCount < 1000)
    );
  }

  @computed get selectFields() {
    if (this.selectAllFields) {
      // Filter out fields with GeoJSON
      return filterOutUndefined(
        this.dataset.fields
          ?.filter(
            f =>
              f.type !== "geo_shape" &&
              !["lat", "lon", "long", "latitude", "longitude"].includes(
                f.name?.toLowerCase() ?? ""
              )
          )
          .map(f => f.name) ?? []
      ).join(", ");
    }

    return filterOutUndefined([
      this.catalogItem.timeFieldName,
      // If aggregating time - avergage color field
      this.aggregateTime
        ? `avg(${this.catalogItem.colorFieldName}) as ${this.catalogItem.colorFieldName}`
        : this.catalogItem.colorFieldName,
      // If aggregating time - use geopoint field
      // Otherwise use region field or geopoint field (in that order)
      this.catalogItem.geoPoint2dFieldName,
      this.catalogItem.regionFieldName
    ]).join(", ");
  }

  @computed get groupByFields() {
    if (this.aggregateTime && this.timeFieldName && this.geoPoint2dFieldName) {
      return `${this.geoPoint2dFieldName},RANGE(${this.timeFieldName}, ${this.aggregateTime}) as ${this.timeFieldName}`;
    }
  }

  @computed get geoPoint2dColumn() {
    if (this.catalogItem.geoPoint2dFieldName) {
      return createStratumInstance(TableColumnTraits, {
        name: this.catalogItem.geoPoint2dFieldName,
        type: "hidden"
      });
    }
  }

  @computed get regionColumn() {
    if (this.catalogItem.regionFieldName) {
      return createStratumInstance(TableColumnTraits, {
        name: this.catalogItem.regionFieldName,
        type: "region"
      });
    }
  }

  @computed get colorColumn() {
    if (!this.catalogItem.colorFieldName) return;

    const f = this.dataset.fields?.find(
      f => f.name === this.catalogItem.colorFieldName
    );
    if (f) {
      return createStratumInstance(TableColumnTraits, {
        name: f.name,
        title: f.label,
        type: f.type === "double" || f.type === "int" ? "scalar" : undefined
      });
    }
  }

  @computed get timeColumn() {
    if (!this.catalogItem.timeFieldName) return;

    const f = this.dataset.fields?.find(
      f => f.name === this.catalogItem.timeFieldName
    );
    if (f) {
      return createStratumInstance(TableColumnTraits, {
        name: f.name,
        title: f.label,
        type: "time"
      });
    }
  }

  @computed get otherColumns() {
    return (
      this.dataset.fields
        ?.filter(f => f.type !== "datetime" && f.type !== "geo_point_2d")
        ?.map(f =>
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

  @computed
  get defaultStyle() {
    return createStratumInstance(TableStyleTraits, {
      latitudeColumn: this.catalogItem.geoPoint2dFieldName ? "lat" : undefined,
      longitudeColumn: this.catalogItem.geoPoint2dFieldName ? "lon" : undefined,

      time: createStratumInstance(TableTimeStyleTraits, {
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

  @computed
  get currentTime() {
    if (!this.pointTimeSeries && this.catalogItem.geoPoint2dFieldName) return;

    if (
      !this.catalogItem.activeTableStyle.timeIntervals ||
      !this.catalogItem.activeTableStyle.rowGroups
    )
      return;

    const groupIntervals = this.catalogItem.activeTableStyle.rowGroups.map(
      ([id, rows]) => {
        let start: JulianDate | undefined;
        let stop: JulianDate | undefined;

        rows.forEach(rowId => {
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

    // const intervals = filterOutUndefined(
    //   this.pointTimeSeries?.map(p =>
    //     p.minTime && p.maxTime
    //       ? new TimeInterval({
    //           start: JulianDate.fromDate(p.minTime),
    //           stop: JulianDate.fromDate(p.maxTime)
    //         })
    //       : undefined
    //   ) ?? []
    // );

    if (groupIntervals.length > 0) {
      const totalInterval = groupIntervals.reduce<TimeInterval | undefined>(
        (intersection, current) =>
          intersection
            ? TimeInterval.intersect(intersection, current)
            : current,
        undefined
      );

      if (totalInterval && !totalInterval.isEmpty) {
        return totalInterval.stop.toString();
      }
    }
  }

  /** Disable date time selector if there is only 1 sample per point */
  @computed get disableDateTimeSelector() {
    return isDefined(this.maxPointSamples) && this.maxPointSamples === 1
      ? true
      : undefined;
  }

  @computed get usefulFields() {
    return (
      this.dataset.fields?.filter(
        f =>
          ["double", "int", "text"].includes(f.type ?? "") &&
          !["lat", "lon", "long", "latitude", "longitude"].includes(
            f.name?.toLowerCase() ?? ""
          ) &&
          !isIdField(f.name) &&
          !isIdField(f.label) &&
          f.name !== this.catalogItem.regionFieldName
      ) ?? []
    );
  }

  @computed get availableFields() {
    if (!this.selectAllFields)
      return [
        createStratumInstance(DimensionTraits, {
          id: "available-fieds",
          name: "Fields",
          selectedId: this.catalogItem.colorFieldName,
          options: this.usefulFields.map(f => ({
            id: f.name,
            name: f.label,
            value: undefined
          }))
        })
      ];
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
  return dataset.fields?.find(f => f.type === "geo_point_2d")?.name;
}

function getTimeField(dataset: Dataset) {
  return dataset.fields?.find(f => f.type === "datetime")?.name;
}

StratumOrder.addLoadStratum(OpenDataSoftDatasetStratum.stratumName);

export default class OpenDataSoftCatalogItem
  extends TableMixin(
    UrlMixin(CatalogMemberMixin(CreateModel(OpenDataSoftCatalogItemTraits)))
  )
  implements SelectableDimensions {
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

    // return [];

    let data: string[][] = [];

    // If not aggregating time - download CSV
    if (!this.useRecordsApi) {
      let q = new Query(
        `/api/v2/catalog/datasets/${this.datasetId}/exports/csv`
      );

      if (this.selectFields) {
        q = q.select(this.selectFields);
      }

      const uri = new URI(`${this.url}${q.toString()}`);

      console.log(uri);

      data = await Csv.parseUrl(
        proxyCatalogItemUrl(this, uri.toString()),
        true,
        true,
        {
          delimiter: ";"
        }
      );
      if (this.geoPoint2dFieldName) {
        const pointCol = data.find(col => col[0] === this.geoPoint2dFieldName);

        data = data.filter(col => col[0] !== this.geoPoint2dFieldName);

        if (pointCol) {
          const lat = ["lat"];
          const lon = ["lon"];
          pointCol.forEach((cell, idx) => {
            if (idx === 0) return;
            const split = cell.split(", ");
            lat.push(split[0] ?? "");
            lon.push(split[1] ?? "");
          });

          data.push(lat, lon);
        }
      }
    } else {
      let q = fromCatalog()
        .dataset(this.datasetId)
        .records()
        .limit(100);

      if (this.timeFieldName) q = q.orderBy(`${this.timeFieldName} DESC`);

      if (this.selectFields) {
        q = q.select(this.selectFields);
      }

      if (this.groupByFields) {
        q = q.groupBy(this.groupByFields);
      }

      // Get 1000 records
      const records = flatten(
        await Promise.all(
          new Array(10)
            .fill(0)
            .map(
              async (v, index) =>
                (await this.apiClient.get(q.offset(index * 100))).records ?? []
            )
        )
      );

      if (records && records.length > 0) {
        const cols: { [key: string]: string[] } = {};

        if (this.geoPoint2dFieldName) {
          cols["lat"] = new Array(records.length).fill("");
          cols["lon"] = new Array(records.length).fill("");
        }
        this.timeFieldName ? (cols[this.timeFieldName] = []) : null;

        records.forEach((record, index) =>
          Object.entries(record.record?.fields ?? {}).forEach(
            ([field, value]) => {
              if (field === this.geoPoint2dFieldName && isJsonObject(value)) {
                cols.lat[index] = `${value.lat}` ?? "";
                cols.lon[index] = `${value.lon}` ?? "";
              } else {
                if (!Array.isArray(cols[field])) {
                  cols[field] = new Array(records.length).fill("");
                }
                cols[field][index] = `${value}`;
              }
            }
          )
        );

        console.log(cols);

        data = Object.entries(cols).map(([field, values]) => [
          field,
          ...values
        ]);
      }

      console.log(records);
    }

    return data;
  }

  @computed
  get selectableDimensions() {
    return [
      ...(this.availableFields?.map(f => ({
        ...f,
        setDimensionValue: (strataId: string, selectedId: string) => {
          this.setTrait(strataId, "colorFieldName", selectedId);
          this.loadMapItems();
        }
      })) ?? []),
      ...super.selectableDimensions.filter(
        s => !this.availableFields || s.id !== "activeStyle"
      )
    ];
  }
}

StratumOrder.addLoadStratum(TableAutomaticStylesStratum.stratumName);
