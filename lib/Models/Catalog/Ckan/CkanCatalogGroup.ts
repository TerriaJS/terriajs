import i18next from "i18next";
import { action, computed, observable, runInAction } from "mobx";
import URI from "urijs";
import isDefined from "../../../Core/isDefined";
import { JsonObject } from "../../../Core/Json";
import loadJson from "../../../Core/loadJson";
import runLater from "../../../Core/runLater";
import TerriaError from "../../../Core/TerriaError";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../../../ModelMixins/GroupMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import CkanCatalogGroupTraits from "../../../Traits/TraitsClasses/CkanCatalogGroupTraits";
import CkanSharedTraits from "../../../Traits/TraitsClasses/CkanSharedTraits";
import ModelReference from "../../../Traits/ModelReference";
import CatalogGroup from "../CatalogGroup";
import { CkanDataset, CkanServerResponse } from "./CkanDefinitions";
import CkanItemReference from "./CkanItemReference";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import LoadableStratum from "../../Definition/LoadableStratum";
import Model, { BaseModel } from "../../Definition/Model";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import StratumOrder from "../../Definition/StratumOrder";
import Terria from "../../Terria";

export function createInheritedCkanSharedTraitsStratum(
  model: Model<CkanSharedTraits>
): Readonly<StratumFromTraits<CkanSharedTraits>> {
  const propertyNames = Object.keys(CkanSharedTraits.traits);
  const reduced: any = propertyNames.reduce(
    (p, c) => ({
      ...p,
      get [c]() {
        return (model as any)[c];
      }
    }),
    {}
  );
  return observable(reduced);
}

createInheritedCkanSharedTraitsStratum.stratumName =
  "ckanItemReferenceInheritedPropertiesStratum";

StratumOrder.addDefinitionStratum(
  createInheritedCkanSharedTraitsStratum.stratumName
);

export class CkanServerStratum extends LoadableStratum(CkanCatalogGroupTraits) {
  static stratumName = "ckanServer";
  groups: CatalogGroup[] = [];
  filteredGroups: CatalogGroup[] = [];
  datasets: CkanDataset[] = [];
  filteredDatasets: CkanDataset[] = [];

  constructor(
    readonly _catalogGroup: CkanCatalogGroup,
    private readonly _ckanResponse: CkanServerResponse
  ) {
    super();
    this.datasets = this.getDatasets();
    this.filteredDatasets = this.getFilteredDatasets();
    this.groups = this.getGroups();
    this.filteredGroups = this.getFilteredGroups();
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new CkanServerStratum(
      model as CkanCatalogGroup,
      this._ckanResponse
    ) as this;
  }

  static addFilterQuery(
    uri: uri.URI,
    filterQuery: JsonObject | string
  ): uri.URI {
    if (typeof filterQuery === "string") {
      // An encoded filterQuery may look like "fq=+(res_format%3Awms%20OR%20res_format%3AWMS)".
      // An unencoded filterQuery may look like "fq=(res_format:wms OR res_format:WMS)".
      // In both cases, don't use addQuery(filterQuery) as "=" will be escaped too, which will
      // cause unexpected result (e.g. empty query result).
      uri.query(uri.query() + "&" + filterQuery);
    } else {
      Object.keys(filterQuery).forEach((key: string) =>
        uri.addQuery(key, (filterQuery as JsonObject)[key])
      );
    }
    uri.normalize();
    return uri;
  }

  static async load(
    catalogGroup: CkanCatalogGroup
  ): Promise<CkanServerStratum | undefined> {
    var terria = catalogGroup.terria;

    let ckanServerResponse: CkanServerResponse | undefined = undefined;

    // Each item in the array causes an independent request to the CKAN, and the results are concatenated
    for (var i = 0; i < catalogGroup.filterQuery.length; ++i) {
      const filterQuery = catalogGroup.filterQuery[i];
      var uri = new URI(catalogGroup.url)
        .segment("api/3/action/package_search")
        .addQuery({ start: 0, rows: 1000, sort: "metadata_created asc" });

      CkanServerStratum.addFilterQuery(uri, filterQuery as JsonObject | string);

      const result = await paginateThroughResults(uri, catalogGroup);
      if (ckanServerResponse === undefined) {
        ckanServerResponse = result;
      } else {
        ckanServerResponse.result.results = ckanServerResponse.result.results.concat(
          result.result.results
        );
      }
    }
    if (ckanServerResponse === undefined) return undefined;
    return new CkanServerStratum(catalogGroup, ckanServerResponse);
  }

  @computed
  get members(): ModelReference[] {
    // When data is grouped (most circumstances) return group id's
    // for those which have content
    if (
      this.filteredGroups !== undefined &&
      this._catalogGroup.groupBy !== "none"
    ) {
      const groupIds: ModelReference[] = [];
      this.filteredGroups.forEach(g => {
        if (g.members.length > 0) {
          groupIds.push(g.uniqueId as ModelReference);
        }
      });
      return groupIds;
    }

    // Otherwise return the id's of all the resources of all the filtered datasets
    const that = this;
    const references: ModelReference[] = [];
    this.filteredDatasets.forEach(ds => {
      ds.resources.forEach(resource => {
        references.push(
          that._catalogGroup.uniqueId + "/" + ds.id + "/" + resource.id
        );
      });
    });
    return references;
  }

  protected getDatasets(): CkanDataset[] {
    return this._ckanResponse.result.results;
  }

  protected getFilteredDatasets(): CkanDataset[] {
    if (this.datasets.length === 0) return [];
    if (this._catalogGroup.blacklist !== undefined) {
      const bl = this._catalogGroup.blacklist;
      return this.datasets.filter(ds => bl.indexOf(ds.title) === -1);
    }
    return this.datasets;
  }

  protected getGroups(): CatalogGroup[] {
    if (this._catalogGroup.groupBy === "none") return [];
    let groups: CatalogGroup[] = [];
    createUngroupedGroup(this, groups);

    if (this._catalogGroup.groupBy === "organization")
      createGroupsByOrganisations(this, groups);
    if (this._catalogGroup.groupBy === "group")
      createGroupsByCkanGroups(this, groups);

    groups = [...new Set(groups)];

    groups.sort(function(a, b) {
      if (a.name === undefined || b.name === undefined) return 0;
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
    return groups;
  }

  protected getFilteredGroups(): CatalogGroup[] {
    if (this.groups.length === 0) return [];
    if (this._catalogGroup.blacklist !== undefined) {
      const bl = this._catalogGroup.blacklist;
      return this.groups.filter(group => {
        if (group.name === undefined) return false;
        else return bl.indexOf(group.name) === -1;
      });
    }
    return this.groups;
  }

  @action
  createMembersFromDatasets() {
    this.filteredDatasets.forEach(dataset => {
      this.createMemberFromDataset(dataset);
    });
  }

  @action
  addCatalogItemToCatalogGroup(
    catalogItem: any,
    dataset: CkanDataset,
    groupId: string
  ) {
    let group:
      | CatalogGroup
      | undefined = this._catalogGroup.terria.getModelById(
      CatalogGroup,
      groupId
    );
    if (group !== undefined) {
      group.add(CommonStrata.definition, catalogItem);
    }
  }

  @action
  addCatalogItemByCkanGroupsToCatalogGroup(
    catalogItem: any,
    dataset: CkanDataset
  ) {
    if (dataset.groups.length === 0) {
      const groupId = this._catalogGroup.uniqueId + "/ungrouped";
      this.addCatalogItemToCatalogGroup(catalogItem, dataset, groupId);
      return;
    }
    dataset.groups.forEach(g => {
      const groupId = this._catalogGroup.uniqueId + "/" + g.id;
      this.addCatalogItemToCatalogGroup(catalogItem, dataset, groupId);
    });
  }

  @action
  createMemberFromDataset(ckanDataset: CkanDataset) {
    if (!isDefined(ckanDataset.id)) {
      return;
    }

    const datasetId = this._catalogGroup.uniqueId + "/" + ckanDataset.id;

    // Create a computed stratum to pass shared configuration down to items
    const inheritedPropertiesStratum = createInheritedCkanSharedTraitsStratum(
      this._catalogGroup
    );

    for (var i = 0; i < ckanDataset.resources.length; ++i) {
      const resource = ckanDataset.resources[i];
      const resourceId = datasetId + "/" + resource.id;

      let item = this._catalogGroup.terria.getModelById(
        CkanItemReference,
        resourceId
      );
      if (item === undefined) {
        item = new CkanItemReference(resourceId, this._catalogGroup.terria);
        item.setDataset(ckanDataset);
        item.setResource(resource);
        item.setCkanCatalog(this._catalogGroup);
        item.setSupportedFormatFromResource(resource);
        if (item._supportedFormat === undefined) {
          continue;
        }
        item.setCkanStrata(item);
        item.terria.addModel(item);

        item.setSharedStratum(inheritedPropertiesStratum);

        if (this._catalogGroup.groupBy === "organization") {
          const groupId = ckanDataset.organization
            ? this._catalogGroup.uniqueId + "/" + ckanDataset.organization.id
            : this._catalogGroup.uniqueId + "/ungrouped";
          this.addCatalogItemToCatalogGroup(item, ckanDataset, groupId);
        } else if (this._catalogGroup.groupBy === "group") {
          this.addCatalogItemByCkanGroupsToCatalogGroup(item, ckanDataset);
        }
      } else {
        return item;
      }
    }
  }
}

StratumOrder.addLoadStratum(CkanServerStratum.stratumName);

export default class CkanCatalogGroup extends UrlMixin(
  GroupMixin(CatalogMemberMixin(CreateModel(CkanCatalogGroupTraits)))
) {
  static readonly type = "ckan-group";

  get type() {
    return CkanCatalogGroup.type;
  }

  get typeName() {
    return i18next.t("models.ckan.nameServer");
  }

  @computed get cacheDuration(): string {
    if (isDefined(super.cacheDuration)) {
      return super.cacheDuration;
    }
    return "1d";
  }

  protected async forceLoadMetadata(): Promise<void> {
    const ckanServerStratum = <CkanServerStratum | undefined>(
      this.strata.get(CkanServerStratum.stratumName)
    );
    if (!ckanServerStratum) {
      const stratum = await CkanServerStratum.load(this);
      if (stratum === undefined) return;
      runInAction(() => {
        this.strata.set(CkanServerStratum.stratumName, stratum);
      });
    }
  }

  protected async forceLoadMembers() {
    const ckanServerStratum = <CkanServerStratum | undefined>(
      this.strata.get(CkanServerStratum.stratumName)
    );
    if (ckanServerStratum) {
      await runLater(() => ckanServerStratum.createMembersFromDatasets());
    }
  }
}

function createGroup(groupId: string, terria: Terria, groupName: string) {
  const g = new CatalogGroup(groupId, terria);
  g.setTrait(CommonStrata.definition, "name", groupName);
  terria.addModel(g);
  return g;
}

function createUngroupedGroup(
  ckanServer: CkanServerStratum,
  groups: CatalogGroup[]
) {
  const groupId = ckanServer._catalogGroup.uniqueId + "/ungrouped";
  let existingGroup = ckanServer._catalogGroup.terria.getModelById(
    CatalogGroup,
    groupId
  );
  if (existingGroup === undefined) {
    existingGroup = createGroup(
      groupId,
      ckanServer._catalogGroup.terria,
      ckanServer._catalogGroup.ungroupedTitle
    );
  }
  groups.push(existingGroup);
}

function createGroupsByOrganisations(
  ckanServer: CkanServerStratum,
  groups: CatalogGroup[]
) {
  ckanServer.filteredDatasets.forEach(ds => {
    if (ds.organization !== null) {
      const groupId =
        ckanServer._catalogGroup.uniqueId + "/" + ds.organization.id;
      let existingGroup = ckanServer._catalogGroup.terria.getModelById(
        CatalogGroup,
        groupId
      );
      if (existingGroup === undefined) {
        existingGroup = createGroup(
          groupId,
          ckanServer._catalogGroup.terria,
          ds.organization.title
        );
      }
      groups.push(existingGroup);
    }
  });
}

function createGroupsByCkanGroups(
  ckanServer: CkanServerStratum,
  groups: CatalogGroup[]
) {
  ckanServer.filteredDatasets.forEach(ds => {
    ds.groups.forEach(g => {
      const groupId = ckanServer._catalogGroup.uniqueId + "/" + g.id;
      let existingGroup = ckanServer._catalogGroup.terria.getModelById(
        CatalogGroup,
        groupId
      );
      if (existingGroup === undefined) {
        existingGroup = createGroup(
          groupId,
          ckanServer._catalogGroup.terria,
          g.display_name
        );
        existingGroup.setTrait(
          CommonStrata.definition,
          "description",
          g.description
        );
      }
      groups.push(existingGroup);
    });
  });
}

async function paginateThroughResults(
  uri: any,
  catalogGroup: CkanCatalogGroup
) {
  const ckanServerResponse = await getCkanDatasets(uri, catalogGroup);
  if (
    ckanServerResponse === undefined ||
    !ckanServerResponse ||
    !ckanServerResponse.help
  ) {
    throw new TerriaError({
      title: i18next.t("models.ckan.errorLoadingTitle"),
      message: i18next.t("models.ckan.errorLoadingMessage", {
        email:
          '<a href="mailto:' +
          catalogGroup.terria.supportEmail +
          '">' +
          catalogGroup.terria.supportEmail +
          "</a>"
      })
    });
  }
  let nextResultStart = 1001;
  while (nextResultStart < ckanServerResponse.result.count) {
    await getMoreResults(
      uri,
      catalogGroup,
      ckanServerResponse,
      nextResultStart
    );
    nextResultStart = nextResultStart + 1000;
  }
  return ckanServerResponse;
}

async function getCkanDatasets(
  uri: any,
  catalogGroup: CkanCatalogGroup
): Promise<CkanServerResponse | undefined> {
  const response: CkanServerResponse = await loadJson(
    proxyCatalogItemUrl(catalogGroup, uri.toString())
  );
  return response;
}

async function getMoreResults(
  uri: any,
  catalogGroup: CkanCatalogGroup,
  baseResults: CkanServerResponse,
  nextResultStart: number
) {
  uri.setQuery("start", nextResultStart);

  const ckanServerResponse = await getCkanDatasets(uri, catalogGroup);
  if (ckanServerResponse === undefined) {
    return;
  }
  baseResults.result.results = baseResults.result.results.concat(
    ckanServerResponse.result.results
  );
}
