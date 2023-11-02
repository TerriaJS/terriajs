import i18next from "i18next";
import { action, computed, runInAction } from "mobx";
import URI from "urijs";
import isDefined from "../../../Core/isDefined";
import loadJson from "../../../Core/loadJson";
import runLater from "../../../Core/runLater";
import TerriaError, { networkRequestError } from "../../../Core/TerriaError";
import AccessControlMixin from "../../../ModelMixins/AccessControlMixin";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../../../ModelMixins/GroupMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import ArcGisPortalCatalogGroupTraits from "../../../Traits/TraitsClasses/ArcGisPortalCatalogGroupTraits";
import ModelReference from "../../../Traits/ModelReference";
import {
  ArcGisItem,
  ArcGisPortalGroup,
  ArcGisPortalGroupSearchResponse,
  ArcGisPortalSearchResponse
} from "./ArcGisPortalDefinitions";
import ArcGisPortalItemReference from "./ArcGisPortalItemReference";
import CatalogGroup from "../CatalogGroup";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import StratumOrder from "../../Definition/StratumOrder";
import Terria from "../../Terria";

export class ArcGisPortalStratum extends LoadableStratum(
  ArcGisPortalCatalogGroupTraits
) {
  static stratumName = "arcgisPortal";
  groups: CatalogGroup[] = [];
  filteredGroups: CatalogGroup[] = [];
  datasets: ArcGisItem[] = [];
  filteredDatasets: ArcGisItem[] = [];

  constructor(
    readonly _catalogGroup: ArcGisPortalCatalogGroup,
    readonly _arcgisResponse: ArcGisPortalSearchResponse,
    readonly _arcgisGroupResponse: ArcGisPortalGroupSearchResponse | undefined
  ) {
    super();
    this.datasets = this.getDatasets();
    this.filteredDatasets = this.getFilteredDatasets();
    this.groups = this.getGroups();
    this.filteredGroups = this.getFilteredGroups();
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new ArcGisPortalStratum(
      model as ArcGisPortalCatalogGroup,
      this._arcgisResponse,
      this._arcgisGroupResponse
    ) as this;
  }

  static async load(
    catalogGroup: ArcGisPortalCatalogGroup
  ): Promise<ArcGisPortalStratum | undefined> {
    var terria = catalogGroup.terria;

    let portalGroupsServerResponse:
      | ArcGisPortalGroupSearchResponse
      | undefined = undefined;
    let portalItemsServerResponse: ArcGisPortalSearchResponse | undefined =
      undefined;

    // If we need to group by groups we use slightly different API's
    // that allow us to get the data more effectively
    if (
      catalogGroup.groupBy === "organisationsGroups" ||
      catalogGroup.groupBy === "usersGroups"
    ) {
      if (catalogGroup.groupBy === "organisationsGroups") {
        const groupSearchUri = new URI(catalogGroup.url)
          .segment("/sharing/rest/community/groups")
          .addQuery({ num: 100, f: "json" });

        if (catalogGroup.groupSearchParams !== undefined) {
          const groupSearchParams = catalogGroup.groupSearchParams;
          Object.keys(groupSearchParams).forEach((key: string) =>
            groupSearchUri.addQuery(key, groupSearchParams[key])
          );
        }

        portalGroupsServerResponse = await paginateThroughResults(
          groupSearchUri,
          catalogGroup
        );
        if (portalGroupsServerResponse === undefined) return undefined;
      } else if (catalogGroup.groupBy === "usersGroups") {
        const groupSearchUri = new URI(catalogGroup.url)
          .segment(`/sharing/rest/community/self`)
          .addQuery({ f: "json" });

        const response = await getPortalInformation(
          groupSearchUri,
          catalogGroup
        );
        if (response === undefined) return undefined;
        portalGroupsServerResponse = {
          total: response.groups.length,
          results: response.groups,
          start: 0,
          num: 0,
          nextStart: 0
        };
      }

      if (portalGroupsServerResponse === undefined) return undefined;

      // Then for each group we've got access to we get the content
      for (let i = 0; i < portalGroupsServerResponse.results.length; ++i) {
        const group: ArcGisPortalGroup = portalGroupsServerResponse.results[i];
        const groupItemSearchUri = new URI(catalogGroup.url)
          .segment(`/sharing/rest/content/groups/${group.id}/search`)
          .addQuery({ num: 100, f: "json" });

        if (catalogGroup.searchParams) {
          const searchParams = catalogGroup.searchParams;
          Object.keys(searchParams).forEach((key: string) =>
            groupItemSearchUri.addQuery(key, searchParams[key])
          );
        }

        const groupResponse: ArcGisPortalSearchResponse | undefined =
          await paginateThroughResults(groupItemSearchUri, catalogGroup);
        if (groupResponse === undefined) return undefined;
        groupResponse.results.forEach((item: ArcGisItem) => {
          item.groupId = group.id;
        });

        if (i === 0) {
          portalItemsServerResponse = groupResponse;
        } else if (
          portalItemsServerResponse !== undefined &&
          groupResponse !== undefined
        ) {
          portalItemsServerResponse.results =
            portalItemsServerResponse.results.concat(groupResponse.results);
        }
      }
    } else {
      // If we don't need to group by Portal Groups then we'll search using
      // the regular endpoint
      const itemSearchUri = new URI(catalogGroup.url)
        .segment("/sharing/rest/search")
        .addQuery({ num: 100, f: "json" });

      if (catalogGroup.searchParams !== undefined) {
        const searchParams = catalogGroup.searchParams;
        const params = Object.keys(searchParams);
        params.forEach((key: string) =>
          itemSearchUri.addQuery(key, searchParams[key])
        );
      }

      portalItemsServerResponse = await paginateThroughResults(
        itemSearchUri,
        catalogGroup
      );

      if (
        catalogGroup.groupBy === "portalCategories" &&
        portalItemsServerResponse !== undefined
      ) {
        const categories = new Map();

        portalItemsServerResponse.results.forEach(function (item) {
          item.categories.forEach(function (
            rawCategory: string,
            index: number
          ) {
            const category = rawCategory.trim();
            if (index === 0) {
              item.groupId = category;
            }
            // "/Categories/Land Parcel and Property"
            if (!categories.has(category)) {
              const categoryPieces = category.split("/");
              const categoryGroup = {
                id: category,
                title: categoryPieces[categoryPieces.length - 1]
              };

              categories.set(category, categoryGroup);
            }
          });
        });
        portalGroupsServerResponse = {
          total: categories.size,
          results: Array.from(categories.values()),
          start: 0,
          num: 0,
          nextStart: 0
        };
      }
    }

    if (portalItemsServerResponse === undefined) return undefined;

    return new ArcGisPortalStratum(
      catalogGroup,
      portalItemsServerResponse,
      portalGroupsServerResponse
    );
  }

  @computed
  get members(): ModelReference[] {
    if (this.filteredGroups.length > 0) {
      const groupIds: ModelReference[] = [];
      this.filteredGroups.forEach((g) => {
        if (this._catalogGroup.hideEmptyGroups && g.members.length > 0) {
          groupIds.push(g.uniqueId as ModelReference);
        } else if (!this._catalogGroup.hideEmptyGroups) {
          groupIds.push(g.uniqueId as ModelReference);
        }
      });
      return groupIds;
    }
    // Otherwise return the id's of all the resources of all the filtered datasets
    return this.filteredDatasets.map((ds) => {
      return this._catalogGroup.uniqueId + "/" + ds.id;
    }, this);
  }

  private getDatasets(): ArcGisItem[] {
    return this._arcgisResponse.results;
  }

  private getFilteredDatasets(): ArcGisItem[] {
    if (this.datasets.length === 0) return [];
    if (this._catalogGroup.excludeMembers !== undefined) {
      const bl = this._catalogGroup.excludeMembers;
      return this.datasets.filter((ds) => bl.indexOf(ds.title) === -1);
    }
    return this.datasets;
  }

  private getGroups(): CatalogGroup[] {
    if (this._catalogGroup.groupBy === "none") return [];

    let groups: CatalogGroup[] = [
      ...createUngroupedGroup(this),
      ...createGroupsByPortalGroups(this)
    ];
    groups.sort(function (a, b) {
      if (a.nameInCatalog === undefined || b.nameInCatalog === undefined)
        return 0;
      if (a.nameInCatalog < b.nameInCatalog) {
        return -1;
      }
      if (a.nameInCatalog > b.nameInCatalog) {
        return 1;
      }
      return 0;
    });
    return groups;
  }

  private getFilteredGroups(): CatalogGroup[] {
    if (this.groups.length === 0) return [];
    if (this._catalogGroup.excludeMembers !== undefined) {
      const bl = this._catalogGroup.excludeMembers;
      return this.groups.filter((group) => {
        if (group.name === undefined) return false;
        else return bl.indexOf(group.name) === -1;
      });
    }
    return this.groups;
  }

  @action
  createMembersFromDatasets() {
    this.filteredDatasets.forEach((dataset) => {
      this.createMemberFromDataset(dataset);
    });
  }

  @action
  addCatalogItemToCatalogGroup(
    catalogItem: any,
    dataset: ArcGisItem,
    groupId: string
  ) {
    let group: CatalogGroup | undefined =
      this._catalogGroup.terria.getModelById(CatalogGroup, groupId);
    if (group !== undefined) {
      group.add(CommonStrata.definition, catalogItem);
    }
  }

  @action
  addCatalogItemByPortalGroupsToCatalogGroup(
    catalogItem: any,
    dataset: ArcGisItem
  ) {
    if (dataset.groupId === undefined) {
      const groupId = this._catalogGroup.uniqueId + "/ungrouped";
      this.addCatalogItemToCatalogGroup(catalogItem, dataset, groupId);
      return;
    }
    const groupId = this._catalogGroup.uniqueId + "/" + dataset.groupId;
    this.addCatalogItemToCatalogGroup(catalogItem, dataset, groupId);
  }

  @action
  createMemberFromDataset(arcgisDataset: ArcGisItem) {
    if (!isDefined(arcgisDataset.id)) {
      return;
    }
    const id = this._catalogGroup.uniqueId;
    const itemId = `${id}/${arcgisDataset.id}`;
    let item = this._catalogGroup.terria.getModelById(
      ArcGisPortalItemReference,
      itemId
    );
    if (item === undefined) {
      item = new ArcGisPortalItemReference(itemId, this._catalogGroup.terria);
      item.setDataset(arcgisDataset);
      item.setArcgisPortalCatalog(this._catalogGroup);
      item.setSupportedFormatFromItem(arcgisDataset);
      item.setArcgisStrata(item);
      item.terria.addModel(item);
    }
    if (
      this._catalogGroup.groupBy === "organisationsGroups" ||
      this._catalogGroup.groupBy === "usersGroups" ||
      this._catalogGroup.groupBy === "portalCategories"
    ) {
      this.addCatalogItemByPortalGroupsToCatalogGroup(item, arcgisDataset);
    }

    if (
      AccessControlMixin.isMixedInto(item) &&
      arcgisDataset.access !== undefined
    ) {
      item.setAccessType(arcgisDataset.access);
    }
  }
}

StratumOrder.addLoadStratum(ArcGisPortalStratum.stratumName);

export default class ArcGisPortalCatalogGroup extends UrlMixin(
  GroupMixin(CatalogMemberMixin(CreateModel(ArcGisPortalCatalogGroupTraits)))
) {
  static readonly type = "arcgis-portal-group";

  get type() {
    return ArcGisPortalCatalogGroup.type;
  }

  get typeName() {
    return i18next.t("models.arcgisPortal.nameGroup");
  }

  @computed
  get cacheDuration(): string {
    if (isDefined(super.cacheDuration)) {
      return super.cacheDuration;
    }
    return "0d";
  }

  protected forceLoadMetadata(): Promise<void> {
    const portalStratum = <ArcGisPortalStratum | undefined>(
      this.strata.get(ArcGisPortalStratum.stratumName)
    );
    if (!portalStratum) {
      return ArcGisPortalStratum.load(this).then((stratum) => {
        if (stratum === undefined) return;
        runInAction(() => {
          this.strata.set(ArcGisPortalStratum.stratumName, stratum);
        });
      });
    } else {
      return Promise.resolve();
    }
  }

  protected async forceLoadMembers() {
    const portalStratum = <ArcGisPortalStratum | undefined>(
      this.strata.get(ArcGisPortalStratum.stratumName)
    );
    if (portalStratum) {
      await runLater(() => portalStratum.createMembersFromDatasets());
    }
  }
}

function createGroup(groupId: string, terria: Terria, groupName: string) {
  const g = new CatalogGroup(groupId, terria);
  g.setTrait(CommonStrata.definition, "name", groupName);
  terria.addModel(g);
  return g;
}

function createUngroupedGroup(arcgisPortal: ArcGisPortalStratum) {
  const groupId = arcgisPortal._catalogGroup.uniqueId + "/ungrouped";
  let existingGroup = arcgisPortal._catalogGroup.terria.getModelById(
    CatalogGroup,
    groupId
  );
  if (existingGroup === undefined) {
    existingGroup = createGroup(
      groupId,
      arcgisPortal._catalogGroup.terria,
      arcgisPortal._catalogGroup.ungroupedTitle
    );
  }
  return [existingGroup];
}

function createGroupsByPortalGroups(arcgisPortal: ArcGisPortalStratum) {
  if (arcgisPortal._arcgisGroupResponse === undefined) return [];
  const out: CatalogGroup[] = [];
  arcgisPortal._arcgisGroupResponse.results.forEach(
    (group: ArcGisPortalGroup) => {
      const groupId = arcgisPortal._catalogGroup.uniqueId + "/" + group.id;
      let existingGroup = arcgisPortal._catalogGroup.terria.getModelById(
        CatalogGroup,
        groupId
      );
      if (existingGroup === undefined) {
        existingGroup = createGroup(
          groupId,
          arcgisPortal._catalogGroup.terria,
          group.title
        );
        if (group.description) {
          existingGroup.setTrait(
            CommonStrata.definition,
            "description",
            group.description
          );
        }
      }

      if (
        AccessControlMixin.isMixedInto(existingGroup) &&
        group.access !== undefined
      ) {
        existingGroup.setAccessType(group.access);
      }
      out.push(existingGroup);
    }
  );
  return out;
}

async function paginateThroughResults(
  uri: any,
  catalogGroup: ArcGisPortalCatalogGroup
) {
  const arcgisPortalResponse = await getPortalInformation(uri, catalogGroup);
  if (arcgisPortalResponse === undefined || !arcgisPortalResponse) {
    throw networkRequestError({
      title: i18next.t("models.arcgisPortal.errorLoadingTitle"),
      message: i18next.t("models.arcgisPortal.errorLoadingMessage")
    });
  }
  let nextStart: number = arcgisPortalResponse.nextStart;
  while (nextStart !== -1) {
    nextStart = await getMoreResults(
      uri,
      catalogGroup,
      arcgisPortalResponse,
      nextStart
    );
  }
  return arcgisPortalResponse;
}

async function getPortalInformation(
  uri: any,
  catalogGroup: ArcGisPortalCatalogGroup
) {
  try {
    const response = await loadJson(
      proxyCatalogItemUrl(
        catalogGroup,
        uri.toString(),
        catalogGroup.cacheDuration
      )
    );
    return response;
  } catch (err) {
    console.log(err);
    return undefined;
  }
}

async function getMoreResults(
  uri: any,
  catalogGroup: ArcGisPortalCatalogGroup,
  baseResults: ArcGisPortalSearchResponse,
  nextResultStart: number
) {
  uri.setQuery("start", nextResultStart);
  try {
    const arcgisPortalResponse = await getPortalInformation(uri, catalogGroup);
    if (arcgisPortalResponse === undefined) {
      return -1;
    }
    baseResults.results = baseResults.results.concat(
      arcgisPortalResponse.results
    );
    return arcgisPortalResponse.nextStart;
  } catch (err) {
    console.log(err);
    return -1;
  }
}
