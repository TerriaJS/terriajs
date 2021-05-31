import { ApiClient, fromCatalog, Query } from "@opendatasoft/api-client";
import { Dataset } from "@opendatasoft/api-client/dist/client/types";
import { computed, runInAction } from "mobx";
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
import OpenDataSoftCatalogItemTraits from "../Traits/OpenDataSoftCatalogItemTraits";
import { DimensionTraits } from "../Traits/SdmxCommonTraits";
import TableColumnTraits from "../Traits/TableColumnTraits";
import TableStyleTraits from "../Traits/TableStyleTraits";
import TableTimeStyleTraits from "../Traits/TableTimeStyleTraits";
import CreateModel from "./CreateModel";
import createStratumInstance from "./createStratumInstance";
import LoadableStratum from "./LoadableStratum";
import { BaseModel } from "./Model";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import SelectableDimensions from "./SelectableDimensions";
import StratumOrder from "./StratumOrder";
import Terria from "./Terria";

export type ValidDataset = Dataset & { dataset_id: string };
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

  @computed get name() {
    return this.dataset.metas?.default?.title ?? this.dataset.dataset_id;
  }

  @computed get description() {
    return this.dataset.metas?.default?.description;
  }

  /** Find field to visualise by defautl (i.e. colorColumn)
   *  It will find the field in this order:
   * - First of type "double"
   * - First of type "int"
   * - First of type "text"
   */
  @computed get colorFieldName() {
    // Filter out not useful fields
    const fields =
      this.dataset.fields?.filter(
        f =>
          ![
            "id",
            "name",
            "lat",
            "lon",
            "long",
            "latitude",
            "longitude"
          ].includes(f.name?.toLowerCase() ?? "")
      ) ?? [];
    return (
      fields.find(f => f.type === "double") ??
      fields.find(f => f.type === "int") ??
      fields.find(f => f.type === "text")
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

  /** Get the maximum number of samples for a given point (or sensor) */
  @computed get maxPointSamples() {
    if (!this.pointTimeSeries) return;
    return Math.max(...this.pointTimeSeries.map(p => p.samples ?? 0));
  }

  @computed get selectAllFields() {
    return (
      (isDefined(this.recordsCount) && this.recordsCount < 10000) ||
      !this.catalogItem.colorFieldName ||
      !(this.catalogItem.geoPoint2dFieldName || this.catalogItem.timeFieldName)
    );
  }

  /** Use records API */
  @computed get useRecordsApi() {
    return (
      !this.recordsCount ||
      (isDefined(this.recordsCount) && this.recordsCount > 50000)
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
      this.aggregateTime
        ? this.catalogItem.geoPoint2dFieldName
        : this.catalogItem.regionFieldName ??
          this.catalogItem.geoPoint2dFieldName
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
            title: f.label
          })
        ) ?? []
    );
  }

  @computed get columns() {
    return filterOutUndefined([
      this.timeColumn,
      this.colorColumn,
      this.regionColumn ?? this.geoPoint2dColumn,
      ...(!this.selectAllFields ? [] : this.otherColumns)
    ]);
  }

  @computed
  get defaultStyle() {
    return createStratumInstance(TableStyleTraits, {
      latitudeColumn: this.catalogItem.geoPoint2dFieldName ? "lat" : undefined,
      longitudeColumn: this.catalogItem.geoPoint2dFieldName ? "lon" : undefined,
      time: createStratumInstance(TableTimeStyleTraits, {
        spreadStartTime: true,
        timeColumn: this.timeColumn?.name,
        idColumns: this.catalogItem.geoPoint2dFieldName
          ? ["lat", "lon"]
          : undefined
      })
    });
  }

  @computed get availableFields() {
    if (!this.selectAllFields)
      return [
        createStratumInstance(DimensionTraits, {
          id: "available-fieds",
          name: "Fields",
          selectedId: this.catalogItem.colorFieldName,
          options: this.dataset.fields
            ?.filter(
              f =>
                ["double", "int", "text"].includes(f.type ?? "") &&
                !["lat", "lon", "long", "latitude", "longitude"].includes(
                  f.name?.toLowerCase() ?? ""
                ) &&
                f.name !== this.catalogItem.regionFieldName
            )
            .map(f => ({ id: f.name, name: f.label }))
        })
      ];
  }

  @computed get activeStyle() {
    return this.catalogItem.colorFieldName;
  }
}

function getGeoPointField(dataset: Dataset) {
  return dataset.fields?.find(f => f.type === "geo_point_2d")?.name;
}

function getTimeField(dataset: Dataset) {
  return dataset.fields?.find(f => f.type === "datetime")?.name;
}

function isValidDataset(dataset: Dataset | undefined): dataset is ValidDataset {
  return isDefined(dataset) && isDefined(dataset.dataset_id);
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

        if (this.geoPoint2dFieldName && !this.regionFieldName) {
          cols["lat"] = [];
          cols["lon"] = [];
        }
        this.timeFieldName ? (cols[this.timeFieldName] = []) : null;
        this.colorFieldName ? (cols[this.colorFieldName] = []) : null;
        this.regionFieldName ? (cols[this.regionFieldName] = []) : null;

        records.forEach((record, index) =>
          Object.entries(record.record?.fields ?? {}).forEach(
            ([field, value]) => {
              if (
                !this.regionFieldName &&
                field === this.geoPoint2dFieldName &&
                isJsonObject(value)
              ) {
                cols.lat[index] = `${value.lat}` ?? "";
                cols.lon[index] = `${value.lon}` ?? "";
              } else {
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
      ...super.selectableDimensions
    ];
  }
}

StratumOrder.addLoadStratum(TableAutomaticStylesStratum.stratumName);
