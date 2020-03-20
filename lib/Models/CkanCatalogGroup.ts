import i18next from "i18next";
import LoadableStratum from "./LoadableStratum";
import { computed, runInAction, action } from "mobx";
import { BaseModel } from "./Model";
import UrlMixin from "../ModelMixins/UrlMixin";
import GroupMixin from "../ModelMixins/GroupMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import CreateModel from "./CreateModel";
import CatalogGroup from "./CatalogGroupNew";
import StratumOrder from "./StratumOrder";
import URI from "urijs";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import TerriaError from "../Core/TerriaError";
import loadJson from "../Core/loadJson";
import isDefined from "../Core/isDefined";
import createStratumInstance from "./createStratumInstance";
import { InfoSectionTraits } from "../Traits/CatalogMemberTraits";
import {createCatalogItemFromCkanResource,
        setupSupportedFormats} from "./CkanCatalogItem";
import filterOutUndefined from "../Core/filterOutUndefined";
import ModelReference from "../Traits/ModelReference";
import CkanCatalogGroupTraits from "../Traits/CkanCatalogGroupTraits";
import CommonStrata from "./CommonStrata";
import Terria from "./Terria";
import replaceUnderscores from "../Core/replaceUnderscores";
import {CkanDataset, CkanResource, CkanSearchResult, CkanServerResponse} from "./CkanDefinitions";


class CkanServerStratum extends LoadableStratum(
  CkanCatalogGroupTraits
) {
  static stratumName = "ckanServer";
  _supportedFormats: any[];
  constructor(
    readonly _catalogGroup: CkanCatalogGroup,
    private readonly _ckanResponse: CkanServerResponse
  ) {
    super();
    this._supportedFormats = setupSupportedFormats(this._catalogGroup)
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new CkanServerStratum(
      model as CkanCatalogGroup,
      this._ckanResponse
    ) as this;
  }

  static async load(
    catalogGroup: CkanCatalogGroup
  ): Promise<CkanServerStratum> {
    var terria = catalogGroup.terria;
    var uri = new URI(catalogGroup.url)
      .segment("api/3/action/package_search")
      .addQuery({ rows: 10, sort: "metadata_created asc" })
      .addQuery({q:"+(res_format:geojson OR res_format:GeoJSON)"});
    return loadJson(proxyCatalogItemUrl(catalogGroup, uri.toString(), "1d"))
      .then((ckanServerResponse: CkanServerResponse) => {
        if (!ckanServerResponse || !ckanServerResponse.help) {
          throw new TerriaError({
            title: i18next.t(
              "models.ckan.errorLoadingTitle"
            ),
            message: i18next.t(
              "models.ckan.errorLoadingMessage",
              {
                email:
                  '<a href="mailto:' +
                  terria.supportEmail +
                  '">' +
                  terria.supportEmail +
                  "</a>"
              }
            )
          });
        }

        return new CkanServerStratum(catalogGroup, ckanServerResponse);
      })
      .catch(() => {
        throw new TerriaError({
          sender: catalogGroup,
          title: i18next.t(
            "models.ckan.errorLoadingTitle"
          ),
          message: i18next.t(
            "models.ckan.corsErrorMessage",
            {
              cors:
                '<a href="http://enable-cors.org/" target="_blank">CORS</a>',
              appName: terria.appName,
              email:
                '<a href="mailto:' +
                terria.supportEmail +
                '">' +
                terria.supportEmail +
                "</a>"
            }
          )
        });
      });
  }

  @computed
  get members(): ModelReference[] {
    // When data is grouped (most circumstances) just return the groups ids
    if (this.groups !== undefined) {
      return this.groups.map(g => g.uniqueId as ModelReference)
    }

    // Otherwise return the id's of all the resources of all the filtered datasets
    const that = this;
    const references:ModelReference[] = [];
    this.filteredDatasets.forEach(ds => {
      ds.resources.forEach(resource => {
        references.push(that._catalogGroup.uniqueId + "/" + ds.id + "/" + resource.id);
      })
    })
    return references
  }

  @computed
  get datasets(): CkanDataset[] {
    return this._ckanResponse.result.results;
  }

  @computed
  get filteredDatasets(): CkanDataset[] {
    if (isDefined(this._catalogGroup.blacklist)) {
      const bl = this._catalogGroup.blacklist
      return this.datasets.filter(ds => bl.indexOf(ds.title) === -1);
    }
    return this.datasets;
  }

  @computed
  get groups(): CatalogGroup[] | undefined {
    if (this._catalogGroup.groupBy === 'none') return undefined

    const groups:CatalogGroup[] = []
    if (this._catalogGroup.groupBy === 'organization') createGroupsByOrganisations(this, groups)
    if (this._catalogGroup.groupBy === 'group') createGroupsByCkanGroups(this, groups)
    return groups
  }

  @action
  createMembersFromLayers() {
    this.filteredDatasets.forEach(dataset => {
      // A catalogItem could be a bunch of things so just set to any
      const catalogItem:any = this.createMemberFromLayer(dataset)
    })
  }

  @action
  addCatalogItemToCatalogGroup(catalogItem: any, dataset: CkanDataset, groupId: string) {
    let group: CatalogGroup | undefined = this._catalogGroup.terria.getModelById(CatalogGroup, groupId)
    if (group !== undefined) {
      group.add('definition', catalogItem)
    }
  }

  @action
  addCatalogItemByCkanGroupsToCatalogGroup(catalogItem: any, dataset: CkanDataset) {
    dataset.groups.forEach(g => {
      const groupId = this._catalogGroup.uniqueId + '/' + g.id
      this.addCatalogItemToCatalogGroup(catalogItem, dataset, groupId)
    })
  }

  @action
  createMemberFromLayer(ckanDataset: CkanDataset) {
    if (!isDefined(ckanDataset.id)) {
      return;
    }

    const id = this._catalogGroup.uniqueId;
    const datasetId = id + "/" + ckanDataset.id;

    for (var i = 0; i < ckanDataset.resources.length; ++i) {
      const resource = ckanDataset.resources[i]
      const item:any = createCatalogItemFromCkanResource(resource, ckanDataset, this._catalogGroup, this._supportedFormats)
      if (this._catalogGroup.groupBy === 'organization' && item !== undefined) {
        const groupId = this._catalogGroup.uniqueId + '/' + ckanDataset.organization.id
        this.addCatalogItemToCatalogGroup(item, ckanDataset, groupId)
      } else if (this._catalogGroup.groupBy !== 'groups' && item !== undefined) {
        this.addCatalogItemByCkanGroupsToCatalogGroup(item, ckanDataset)
      }
    }
  }
}

StratumOrder.addLoadStratum(CkanServerStratum.stratumName);

export default class CkanCatalogGroup extends UrlMixin(
  GroupMixin(
    CatalogMemberMixin(CreateModel(CkanCatalogGroupTraits))
  )
) {
  static readonly type = "ckan";

  get type() {
    return CkanCatalogGroup.type;
  }

  get typeName() {
    return i18next.t("models.ckan.nameServer");
  }

  protected forceLoadMetadata(): Promise<void> {
    return CkanServerStratum.load(this).then(stratum => {
      runInAction(() => {
        this.strata.set(CkanServerStratum.stratumName, stratum);
      });
    });
  }

  protected forceLoadMembers(): Promise<void> {
    return this.loadMetadata().then(() => {
      const ckanServerStratum = <CkanServerStratum | undefined>(
        this.strata.get(CkanServerStratum.stratumName)
      );
      if (ckanServerStratum) {
        ckanServerStratum.createMembersFromLayers();
      }
    });
  }
}

function createGroup (groupId: string, terria: Terria, groupName: string) {
  const g = new CatalogGroup(groupId, terria)
  g.setTrait('definition', 'name', groupName)
  terria.addModel(g);
  return g
}

function createGroupsByOrganisations (ckanServer: CkanServerStratum, groups: CatalogGroup[]) {
  ckanServer.filteredDatasets.forEach(ds => {
    const groupId = ckanServer._catalogGroup.uniqueId + '/' + ds.organization.id
    let existingGroup = ckanServer._catalogGroup.terria.getModelById(CatalogGroup, groupId)
    if (existingGroup === undefined) {
      const group = createGroup(groupId, ckanServer._catalogGroup.terria, ds.organization.title)
      groups.push(group)
    }
  })
}

function createGroupsByCkanGroups (ckanServer: CkanServerStratum, groups: CatalogGroup[]) {
  ckanServer.filteredDatasets.forEach(ds => {
    ds.groups.forEach(g => {
      const groupId = ckanServer._catalogGroup.uniqueId + '/' + g.id
      let existingGroup = ckanServer._catalogGroup.terria.getModelById(CatalogGroup, groupId)
      if (existingGroup === undefined) {
        const group = createGroup(groupId, ckanServer._catalogGroup.terria, g.display_name)
        group.setTrait('definition', 'description', g.description)

        groups.push(group)
      }
    })
  })
}
