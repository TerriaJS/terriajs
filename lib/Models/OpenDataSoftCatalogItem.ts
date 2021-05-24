import { ApiClient, fromCatalog, Query } from "@opendatasoft/api-client";
import { Dataset } from "@opendatasoft/api-client/dist/client/types";
import { computed, runInAction } from "mobx";
import URI from "urijs";
import filterOutUndefined from "../Core/filterOutUndefined";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import TableMixin from "../ModelMixins/TableMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import Csv from "../Table/Csv";
import TableAutomaticStylesStratum from "../Table/TableAutomaticStylesStratum";
import OpenDataSoftCatalogItemTraits from "../Traits/OpenDataSoftCatalogItemTraits";
import TableColumnTraits from "../Traits/TableColumnTraits";
import TableStyleTraits from "../Traits/TableStyleTraits";
import TableTimeStyleTraits from "../Traits/TableTimeStyleTraits";
import CreateModel from "./CreateModel";
import createStratumInstance from "./createStratumInstance";
import LoadableStratum from "./LoadableStratum";
import { BaseModel } from "./Model";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import StratumOrder from "./StratumOrder";
import Terria from "./Terria";

export type ValidDataset = Dataset & { dataset_id: string };

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
      fromCatalog()
        .dataset(catalogItem.datasetId)
        .itself()
    );

    if (!response.dataset || !response.dataset.dataset_id)
      throw `Could not find dataset \`${catalogItem.datasetId}\``;
    return new OpenDataSoftDatasetStratum(
      catalogItem,
      response.dataset as ValidDataset
    );
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new OpenDataSoftDatasetStratum(
      model as OpenDataSoftCatalogItem,
      this.dataset
    ) as this;
  }

  constructor(
    private readonly catalogItem: OpenDataSoftCatalogItem,
    private readonly dataset: ValidDataset
  ) {
    super();
  }

  @computed get name() {
    return this.dataset.metas?.default?.title ?? this.dataset.dataset_id;
  }

  @computed get description() {
    return this.dataset.metas?.default?.description;
  }

  @computed get selectFields() {
    // Filter out fields with GeoJSON
    return filterOutUndefined(
      this.dataset.fields
        ?.filter(f => f.type !== "geo_shape")
        .map(f => f.name) ?? []
    );
  }

  @computed get geoPoint2dField() {
    return this.dataset.fields?.find(f => f.type === "geo_point_2d")?.name;
  }

  @computed get geoPoint2dColumn() {
    if (this.geoPoint2dField) {
      return createStratumInstance(TableColumnTraits, {
        name: this.geoPoint2dField,
        type: "hidden"
      });
    }
  }

  @computed get timeColumn() {
    const f = this.dataset.fields?.find(f => f.type === "datetime");

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
      this.geoPoint2dColumn,
      ...this.otherColumns
    ]);
  }

  @computed
  get defaultStyle() {
    if (!this.timeColumn) return;
    return createStratumInstance(TableStyleTraits, {
      time: createStratumInstance(TableTimeStyleTraits, {
        timeColumn: this.timeColumn.name,
        idColumns: this.geoPoint2dField ? ["lat", "lon"] : undefined
      })
    });
  }
}

StratumOrder.addLoadStratum(OpenDataSoftDatasetStratum.stratumName);

export default class OpenDataSoftCatalogItem extends TableMixin(
  UrlMixin(CatalogMemberMixin(CreateModel(OpenDataSoftCatalogItemTraits)))
) {
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

    let q = new Query(`/api/v2/catalog/datasets/${this.datasetId}/exports/csv`);

    if (this.selectFields) {
      q = q.select(this.selectFields.join(", "));
    }

    const uri = new URI(`${this.url}${q.toString()}`);

    const data = await Csv.parseUrl(
      proxyCatalogItemUrl(this, uri.toString()),
      true,
      true,
      {
        delimiter: ";"
      }
    );

    if (this.geoPoint2dField) {
      const pointCol = data.find(col => col[0] === this.geoPoint2dField);

      if (pointCol) {
        const lat = ["lat"];
        const lon = ["lon"];
        pointCol.forEach(cell => {
          const split = cell.split(", ");
          lat.push(split[0] ?? "");
          lon.push(split[1] ?? "");
        });

        data.push(lat, lon);
      }
    }

    return data;
  }
}

StratumOrder.addLoadStratum(TableAutomaticStylesStratum.stratumName);
