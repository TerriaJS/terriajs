import i18next from "i18next";
import { action, computed, observable, runInAction } from "mobx";
import URI from "urijs";
import flatten from "../../../Core/flatten";
import isDefined from "../../../Core/isDefined";
import { JsonObject } from "../../../Core/Json";
import loadJson from "../../../Core/loadJson";
import runLater from "../../../Core/runLater";
import { networkRequestError } from "../../../Core/TerriaError";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../../../ModelMixins/GroupMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import ModelReference from "../../../Traits/ModelReference";
import CkanCatalogGroupTraits from "../../../Traits/TraitsClasses/CkanCatalogGroupTraits";
import CkanSharedTraits from "../../../Traits/TraitsClasses/CkanSharedTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import LoadableStratum from "../../Definition/LoadableStratum";
import Model, { BaseModel } from "../../Definition/Model";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import StratumOrder from "../../Definition/StratumOrder";
import Terria from "../../Terria";
import CatalogGroup from "../CatalogGroup";
import WebMapServiceCatalogItem from "../Ows/WebMapServiceCatalogItem";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import CkanDefaultFormatsStratum from "./CkanDefaultFormatsStratum";
import {
  CkanDataset,
  CkanResource,
  CkanServerResponse
} from "./CkanDefinitions";
import CkanItemReference, {
  CkanResourceWithFormat,
  getCkanItemName,
  getSupportedFormats,
  PreparedSupportedFormat,
  prepareSupportedFormat
} from "./CkanItemReference";

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

// This can't be definition stratum, as then it will sit on top of underride/definition/override
// CkanServerStratum.createMemberFromDataset will use `definition`
StratumOrder.addLoadStratum(createInheritedCkanSharedTraitsStratum.stratumName);

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
        ckanServerResponse.result.results =
          ckanServerResponse.result.results.concat(result.result.results);
      }
    }
    if (ckanServerResponse === undefined) return undefined;
    return new CkanServerStratum(catalogGroup, ckanServerResponse);
  }

  @computed
  get preparedSupportedFormats(): PreparedSupportedFormat[] {
    return this._catalogGroup.supportedResourceFormats
      ? this._catalogGroup.supportedResourceFormats.map(prepareSupportedFormat)
      : [];
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
      this.filteredGroups.forEach((g) => {
        if (g.members.length > 0) {
          groupIds.push(g.uniqueId as ModelReference);
        }
      });
      return groupIds;
    }

    return flatten(
      this.filteredDatasets.map((dataset) =>
        dataset.resources.map((resource) => this.getItemId(dataset, resource))
      )
    );
  }

  protected getDatasets(): CkanDataset[] {
    return this._ckanResponse.result.results;
  }

  @action
  protected getFilteredDatasets(): CkanDataset[] {
    if (this.datasets.length === 0) return [];
    if (this._catalogGroup.excludeMembers !== undefined) {
      const bl = this._catalogGroup.excludeMembers;
      return this.datasets.filter((ds) => bl.indexOf(ds.title) === -1);
    }
    return this.datasets;
  }

  @action
  protected getGroups(): CatalogGroup[] {
    if (this._catalogGroup.groupBy === "none") return [];
    let groups: CatalogGroup[] = [];

    if (this._catalogGroup.groupBy === "organization")
      createGroupsByOrganisations(this, groups);
    if (this._catalogGroup.groupBy === "group")
      createGroupsByCkanGroups(this, groups);

    const ungroupedGroup = createUngroupedGroup(this);

    groups = [...new Set(groups)];

    groups.sort(function (a, b) {
      if (a.name === undefined || b.name === undefined) return 0;
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });

    // Put "ungrouped" group at end of groups
    return [...groups, ungroupedGroup];
  }

  @action
  protected getFilteredGroups(): CatalogGroup[] {
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
    dataset: CkanDataset,
    groupId: string
  ) {
    let group: CatalogGroup | undefined =
      this._catalogGroup.terria.getModelById(CatalogGroup, groupId);
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
    dataset.groups.forEach((g) => {
      const groupId = this._catalogGroup.uniqueId + "/" + g.id;
      this.addCatalogItemToCatalogGroup(catalogItem, dataset, groupId);
    });
  }

  @action
  createMemberFromDataset(ckanDataset: CkanDataset) {
    if (!isDefined(ckanDataset.id)) {
      return;
    }

    /** If excludeInactiveDatasets is true - then filter out datasets with one of the following
     * - state === "deleted" (CKAN official)
     * - state === "draft" (CKAN official)
     * - data_state === "inactive" (Data.gov.au CKAN)
     */
    if (
      this._catalogGroup.excludeInactiveDatasets &&
      (ckanDataset.state === "deleted" ||
        ckanDataset.state === "draft" ||
        ckanDataset.data_state === "inactive")
    ) {
      return;
    }

    // Get list of resources to turn into CkanItemReferences
    const supportedResources = getSupportedFormats(
      ckanDataset,
      this.preparedSupportedFormats
    );
    let filteredResources: CkanResourceWithFormat[] = [];
    // Track format IDS which multiple resources
    // As if they do, we will need to make sure that CkanItemReference uses resource name (instead of dataset name)
    let formatsWithMultipleResources = new Set<string>();

    if (this._catalogGroup.useSingleResource) {
      filteredResources = supportedResources[0] ? [supportedResources[0]] : [];
    } else {
      // Apply CkanResourceFormatTraits constraints
      // - onlyUseIfSoleResource
      // - removeDuplicates

      this.preparedSupportedFormats.forEach((supportedFormat) => {
        let matchingResources = supportedResources.filter(
          (format) => format.format.id === supportedFormat.id
        );
        if (matchingResources.length === 0) return;

        // Remove duplicate resources (by name property)
        // If multiple are found, use newest resource (by created property)
        if (supportedFormat.removeDuplicates) {
          matchingResources = Object.values(
            matchingResources.reduce<{
              [name: string]: CkanResourceWithFormat;
            }>((uniqueResources, currentResource) => {
              const currentResourceName = currentResource.resource.name;
              // Set resource if none found for currentResourceName
              // Or if found duplicate, and current is a "newer" resource, replace it in uniqueResources
              if (
                !uniqueResources[currentResourceName] ||
                (uniqueResources[currentResourceName] &&
                  uniqueResources[currentResourceName].resource.created <
                    currentResource.resource.created)
              ) {
                uniqueResources[currentResourceName] = currentResource;
              }
              return uniqueResources;
            }, {})
          );
        }

        if (supportedFormat.onlyUseIfSoleResource) {
          if (supportedResources.length === matchingResources.length) {
            filteredResources.push(...matchingResources);
          }
        } else {
          filteredResources.push(...matchingResources);
        }

        if (matchingResources.length > 1 && supportedFormat.id) {
          formatsWithMultipleResources.add(supportedFormat.id);
        }
      });
    }

    // Create CkanItemReference for each filteredResource

    // Create a computed stratum to pass shared configuration down to items
    const inheritedPropertiesStratum = createInheritedCkanSharedTraitsStratum(
      this._catalogGroup
    );

    for (var i = 0; i < filteredResources.length; ++i) {
      const { resource, format } = filteredResources[i];

      const itemId = this.getItemId(ckanDataset, resource);

      let item = this._catalogGroup.terria.getModelById(
        CkanItemReference,
        itemId
      );
      if (item === undefined) {
        item = new CkanItemReference(itemId, this._catalogGroup.terria);

        // If we only have one resources for this dataset - disable these traits which change name
        if (filteredResources.length === 1) {
          item.setTrait(
            CommonStrata.override,
            "useCombinationNameWhereMultipleResources",
            false
          );
          item.setTrait(
            CommonStrata.override,
            "useDatasetNameAndFormatWhereMultipleResources",
            false
          );
        }
        // If we have multiple resources for a given format, make sure we use resource name
        else if (format.id && formatsWithMultipleResources.has(format.id)) {
          item.setTrait(CommonStrata.override, "useResourceName", true);
        }

        item.setDataset(ckanDataset);
        item.setCkanCatalog(this._catalogGroup);
        item.setSharedStratum(inheritedPropertiesStratum);

        item.setResource(resource);
        item.setSupportedFormat(format);

        item.setCkanStrata(item);

        // If Item is WMS-group and allowEntireWmsServers === false, then stop here
        if (
          format.definition?.type === WebMapServiceCatalogItem.type &&
          !item.wmsLayers &&
          !this._catalogGroup.allowEntireWmsServers
        ) {
          return;
        }

        item.terria.addModel(item);

        const name = getCkanItemName(item);
        if (name) item.setTrait(CommonStrata.definition, "name", name);

        if (this._catalogGroup.groupBy === "organization") {
          const groupId = ckanDataset.organization
            ? this._catalogGroup.uniqueId + "/" + ckanDataset.organization.id
            : this._catalogGroup.uniqueId + "/ungrouped";
          this.addCatalogItemToCatalogGroup(item, ckanDataset, groupId);
        } else if (this._catalogGroup.groupBy === "group") {
          this.addCatalogItemByCkanGroupsToCatalogGroup(item, ckanDataset);
        }
      }
    }
  }

  @action
  getItemId(ckanDataset: CkanDataset, resource: CkanResource) {
    return `${this._catalogGroup.uniqueId}/${ckanDataset.id}/${resource.id}`;
  }
}

StratumOrder.addLoadStratum(CkanServerStratum.stratumName);

export default class CkanCatalogGroup extends UrlMixin(
  GroupMixin(CatalogMemberMixin(CreateModel(CkanCatalogGroupTraits)))
) {
  static readonly type = "ckan-group";

  constructor(
    uniqueId: string | undefined,
    terria: Terria,
    sourceReference?: BaseModel
  ) {
    super(uniqueId, terria, sourceReference);

    this.strata.set(
      CkanDefaultFormatsStratum.stratumName,
      new CkanDefaultFormatsStratum()
    );
  }

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

function createUngroupedGroup(ckanServer: CkanServerStratum) {
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
  return existingGroup;
}

function createGroupsByOrganisations(
  ckanServer: CkanServerStratum,
  groups: CatalogGroup[]
) {
  ckanServer.filteredDatasets.forEach((ds) => {
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
  ckanServer.filteredDatasets.forEach((ds) => {
    ds.groups.forEach((g) => {
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
    throw networkRequestError({
      title: i18next.t("models.ckan.errorLoadingTitle"),
      message: i18next.t("models.ckan.errorLoadingMessage")
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
