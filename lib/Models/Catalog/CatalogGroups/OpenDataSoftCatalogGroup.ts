import { ApiClient, fromCatalog } from "@opendatasoft/api-client";
import { Dataset, Facet } from "@opendatasoft/api-client/dist/client/types";
import i18next from "i18next";
import { action, computed, runInAction } from "mobx";
import URI from "urijs";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import isDefined from "../../../Core/isDefined";
import runLater from "../../../Core/runLater";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../../../ModelMixins/GroupMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import ModelReference from "../../../Traits/ModelReference";
import { MetadataUrlTraits } from "../../../Traits/TraitsClasses/CatalogMemberTraits";
import OpenDataSoftCatalogGroupTraits, {
  RefineTraits
} from "../../../Traits/TraitsClasses/OpenDataSoftCatalogGroupTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import createStratumInstance from "../../Definition/createStratumInstance";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import StratumOrder from "../../Definition/StratumOrder";
import OpenDataSoftCatalogItem from "../CatalogItems/OpenDataSoftCatalogItem";

// "Valid" types which force some properties to be defined
export type ValidDataset = Dataset & { dataset_id: string };
export type ValidFacet = Facet & { name: string; facets?: ValidFacet[] };

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

    let datasets: ValidDataset[] = [];
    let facets: ValidFacet[] | undefined;

    // If no facetFilters, try to get some facets
    if (
      catalogGroup.facetFilters &&
      catalogGroup.facetFilters.length === 0 &&
      !catalogGroup.flatten
    ) {
      facets = (await client.get(fromCatalog().facets())).facets?.filter((f) =>
        isValidFacet(f)
      ) as ValidFacet[];
    }

    // If no facets (or we have facetFiles) - get datasets
    if (!facets || facets.length === 0) {
      // We can only fetch datasets in batch of 100
      let offset = 0;
      let totalDatasets: number | undefined;
      const limit = 100;

      let q = fromCatalog()
        .datasets()
        .limit(limit)
        .orderBy("title asc")
        // Filter dataset with 'geo' or 'timeserie' features.
        // Possible values: calendar, geo, image, apiproxy, timeserie, and aggregate
        .where(`features = "geo" OR features = "timeserie"`);

      // If facet filters, use them to filter datasets
      if (catalogGroup.facetFilters && catalogGroup.facetFilters.length > 0) {
        q = q.refine(
          catalogGroup.facetFilters.map((f) => `${f.name}:${f.value}`).join(",")
        );
      }

      while (!isDefined(totalDatasets) || offset < totalDatasets) {
        q = q.offset(offset);

        const catalog = await client.get(q);

        totalDatasets = catalog.total_count ?? 0;

        catalog.datasets?.forEach((response) => {
          if (isValidDataset(response.dataset)) {
            datasets.push(response.dataset);
          }
        });

        offset += limit;
      }
    }

    return new OpenDataSoftCatalogStratum(
      catalogGroup,
      undefined,
      facets ?? [],
      datasets ?? []
    );
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new OpenDataSoftCatalogStratum(
      model as OpenDataSoftCatalogGroup,
      this.facetName,
      this.facets,
      this.datasets
    ) as this;
  }
  constructor(
    private readonly catalogGroup: OpenDataSoftCatalogGroup,
    readonly facetName: string | undefined,
    readonly facets: ValidFacet[],
    readonly datasets: ValidDataset[]
  ) {
    super();
  }

  @computed
  get members(): ModelReference[] {
    return [
      ...this.facets.map((f) => this.getFacetId(f)),
      ...this.datasets.map((d) => this.getDatasetId(d))
    ];
  }

  createMembers() {
    this.facets.forEach((facet) => this.createGroupFromFacet(facet));
    this.datasets.forEach((dataset) => this.createMemberFromDataset(dataset));
  }

  /** Turn facet into OpenDataSoftCatalogGroup */
  @action
  createGroupFromFacet(facet: ValidFacet) {
    const layerId = this.getFacetId(facet);

    if (!layerId) {
      return;
    }

    const existingGroupModel = this.catalogGroup.terria.getModelById(
      OpenDataSoftCatalogGroup,
      layerId
    );

    let groupModel: OpenDataSoftCatalogGroup;
    if (existingGroupModel === undefined) {
      groupModel = new OpenDataSoftCatalogGroup(
        layerId,
        this.catalogGroup.terria,
        undefined
      );
      this.catalogGroup.terria.addModel(groupModel);
    } else {
      groupModel = existingGroupModel;
    }

    // Replace the stratum inherited from the parent group.
    groupModel.strata.delete(CommonStrata.definition);

    groupModel.setTrait(
      CommonStrata.definition,
      "name",
      `${facet.name}${facet.count ? ` (${facet.count ?? 0})` : ""}`
    );
    groupModel.setTrait(CommonStrata.definition, "url", this.catalogGroup.url);

    // Set OpenDataSoftDatasetStratum so it doesn't have to be loaded gain
    groupModel.strata.delete(OpenDataSoftCatalogStratum.stratumName);

    // If no more facets, set facetFilter
    if (
      !facet.facets ||
      !Array.isArray(facet.facets) ||
      facet.facets.length === 0
    ) {
      groupModel.setTrait(CommonStrata.definition, "facetFilters", [
        createStratumInstance(RefineTraits, {
          name: this.facetName,
          value: facet.name
        })
      ]);
    } else {
      groupModel.strata.set(
        OpenDataSoftCatalogStratum.stratumName,
        new OpenDataSoftCatalogStratum(groupModel, facet.name, facet.facets, [])
      );
    }
  }

  /** Turn dataset into OpenDataSoftCatalogItem */
  @action
  createMemberFromDataset(dataset: ValidDataset) {
    const layerId = this.getDatasetId(dataset);

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
      // Add older shareKey
      this.catalogGroup.terria.addShareKey(
        layerId,
        `${this.catalogGroup.uniqueId}/${dataset.dataset_id}`
      );
    } else {
      itemModel = existingItemModel;
    }

    // Replace the stratum inherited from the parent group.
    itemModel.strata.delete(CommonStrata.definition);

    itemModel.setTrait(
      CommonStrata.definition,
      "datasetId",
      dataset.dataset_id
    );
    itemModel.setTrait(CommonStrata.definition, "url", this.catalogGroup.url);
    itemModel.setTrait(
      CommonStrata.definition,
      "name",
      dataset.metas?.default?.title ?? dataset.dataset_id
    );
    itemModel.setTrait(
      CommonStrata.definition,
      "description",
      dataset.metas?.default?.description ?? undefined
    );
    itemModel.setTrait(CommonStrata.definition, "metadataUrls", [
      createStratumInstance(MetadataUrlTraits, {
        title: i18next.t("models.openDataSoft.viewDatasetPage"),
        url: `${this.catalogGroup.url}/explore/dataset/${dataset.dataset_id}/information/`
      })
    ]);
  }

  getDatasetId(dataset: ValidDataset) {
    // Use OpenDataSoft server hostname for datasets, so we don't create multiple across facets
    return `${
      this.catalogGroup.url
        ? URI(this.catalogGroup.url).hostname()
        : this.catalogGroup.uniqueId
    }/${dataset.dataset_id}`;
  }

  getFacetId(facet: ValidFacet) {
    return `${this.catalogGroup.uniqueId}/${facet.name}`;
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

export function isValidDataset(
  dataset: Dataset | undefined
): dataset is ValidDataset {
  return isDefined(dataset) && isDefined(dataset.dataset_id);
}

export function isValidFacet(facet: Facet | undefined): facet is ValidFacet {
  return (
    isDefined(facet) &&
    isDefined(facet.name) &&
    (facet.facets ?? []).reduce<boolean>(
      (valid, current) => valid && isValidFacet(current),
      true
    )
  );
}
