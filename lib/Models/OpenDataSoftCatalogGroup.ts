import { ApiClient, fromCatalog } from "@opendatasoft/api-client";
import { action, computed, runInAction } from "mobx";
import filterOutUndefined from "../Core/filterOutUndefined";
import isDefined from "../Core/isDefined";
import runLater from "../Core/runLater";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../ModelMixins/GroupMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import ModelReference from "../Traits/ModelReference";
import OpenDataSoftCatalogGroupTraits from "../Traits/OpenDataSoftCatalogGroupTraits";
import CommonStrata from "./CommonStrata";
import CreateModel from "./CreateModel";
import LoadableStratum from "./LoadableStratum";
import { BaseModel } from "./Model";
import OpenDataSoftCatalogItem, {
  ValidDataset,
  OpenDataSoftDatasetStratum
} from "./OpenDataSoftCatalogItem";
import StratumOrder from "./StratumOrder";

export class OpenDataSoftCatalogStratum extends LoadableStratum(
  OpenDataSoftCatalogGroupTraits
) {
  static stratumName = "openDataSoftCatalog";

  static async load(
    catalogGroup: OpenDataSoftCatalogGroup
  ): Promise<OpenDataSoftCatalogStratum> {
    if (!catalogGroup.url) throw "`url` must be set";
    const client = new ApiClient({
      domain: catalogGroup.url
    });

    const catalog = await client.get(fromCatalog().datasets());

    let datasets = filterOutUndefined(
      catalog.datasets
        ?.map(d => d.dataset)
        .filter(d => isDefined(d?.dataset_id)) ?? []
    ) as ValidDataset[];

    // Filter dataset with 'geo' or 'timeserie' features.
    // Possible values: calendar, geo, image, apiproxy, timeserie, and aggregate
    datasets = datasets.filter(
      d => d.features?.includes("geo") || d.features?.includes("timeserie")
    );

    console.log(catalog);

    return new OpenDataSoftCatalogStratum(catalogGroup, datasets);
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new OpenDataSoftCatalogStratum(
      model as OpenDataSoftCatalogGroup,
      this.datasets
    ) as this;
  }
  constructor(
    private readonly catalogGroup: OpenDataSoftCatalogGroup,
    readonly datasets: ValidDataset[]
  ) {
    super();
  }

  @computed
  get members(): ModelReference[] {
    return Object.values(this.datasets).map(d => this.getMemberId(d));
  }

  createMembers() {
    Object.values(this.datasets).forEach(dataset =>
      this.createMemberFromDataset(dataset)
    );
  }

  @action
  createMemberFromDataset(dataset: ValidDataset) {
    const layerId = this.getMemberId(dataset);

    if (!layerId) {
      return;
    }

    const existingItemModel = this.catalogGroup.terria.getModelById(
      OpenDataSoftCatalogItem,
      layerId
    );

    let itemModel: OpenDataSoftCatalogItem;
    if (existingItemModel === undefined) {
      itemModel = new OpenDataSoftCatalogItem(
        layerId,
        this.catalogGroup.terria,
        undefined
      );
      this.catalogGroup.terria.addModel(itemModel);
    } else {
      itemModel = existingItemModel;
    }

    // Replace the stratum inherited from the parent group.
    const stratum = CommonStrata.underride;

    itemModel.strata.delete(stratum);

    itemModel.setTrait(stratum, "datasetId", dataset.dataset_id);

    itemModel.setTrait(stratum, "url", this.catalogGroup.url);

    // Set OpenDataSoftDatasetStratum so it doesn't have to be loaded gain
    itemModel.strata.delete(OpenDataSoftDatasetStratum.stratumName);
    itemModel.strata.set(
      OpenDataSoftDatasetStratum.stratumName,
      new OpenDataSoftDatasetStratum(itemModel, dataset)
    );
  }

  getMemberId(dataset: ValidDataset) {
    return `${this.catalogGroup.uniqueId}/${dataset.dataset_id}`;
  }
}

StratumOrder.addLoadStratum(OpenDataSoftCatalogStratum.stratumName);

export default class OpenDataSoftCatalogGroup extends UrlMixin(
  GroupMixin(CatalogMemberMixin(CreateModel(OpenDataSoftCatalogGroupTraits)))
) {
  static readonly type = "opendatasoft-group";

  get type() {
    return OpenDataSoftCatalogGroup.type;
  }

  protected async forceLoadMetadata(): Promise<void> {
    if (!this.strata.has(OpenDataSoftCatalogStratum.stratumName)) {
      const stratum = await OpenDataSoftCatalogStratum.load(this);
      runInAction(() => {
        this.strata.set(OpenDataSoftCatalogStratum.stratumName, stratum);
      });
    }
  }

  protected async forceLoadMembers() {
    const opendatasoftServerStratum = <OpenDataSoftCatalogStratum | undefined>(
      this.strata.get(OpenDataSoftCatalogStratum.stratumName)
    );
    if (opendatasoftServerStratum) {
      await runLater(() => opendatasoftServerStratum.createMembers());
    }
  }
}
