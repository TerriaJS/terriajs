import i18next from "i18next";
import { action, computed, runInAction } from "mobx";
import threddsCrawler from "thredds-catalog-crawler";
import isDefined from "../Core/isDefined";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../ModelMixins/GroupMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import ThreddsCatalogGroupTraits from "../Traits/ThreddsCatalogGroupTraits";
import ModelReference from "../Traits/ModelReference";
import CatalogGroup from "./CatalogGroupNew";
import CreateModel from "./CreateModel";
import LoadableStratum from "./LoadableStratum";
import { BaseModel } from "./Model";
import StratumOrder from "./StratumOrder";
import WebMapServiceCatalogGroup from "./WebMapServiceCatalogGroup";

interface ThreddsCatalog {
  id: string;
  name: string;
  isLoaded: boolean;
  url: string;
  supportsWms: boolean;
  hasDatasets: boolean;
  hasNestedCatalogs: boolean;
  datasets: ThreddsDataset[];
  catalogs: ThreddsCatalog[];
  getAllChildDatasets: Function;
  loadAllNestedCatalogs: Function;
  loadNestedCatalogById: Function;
}

interface ThreddsDataset {
  id: string;
  name: string;
  url: string;
  wmsUrl: string;
  supportsWms: boolean;
  isParentDataset: boolean;
  datasets: ThreddsDataset[];
  catalogs: ThreddsCatalog[];
}

export class ThreddsStratum extends LoadableStratum(ThreddsCatalogGroupTraits) {
  static stratumName = "thredds";

  constructor(
    readonly _catalogGroup: ThreddsCatalogGroup,
    readonly threddsCatalog: ThreddsCatalog
  ) {
    super();
    this.createMembers();
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new ThreddsStratum(
      model as ThreddsCatalogGroup,
      this.threddsCatalog
    ) as this;
  }

  static async load(
    catalogGroup: ThreddsCatalogGroup
  ): Promise<ThreddsStratum | undefined> {
    var terria = catalogGroup.terria;
    const threddsCatalog: ThreddsCatalog = await threddsCrawler(
      catalogGroup.url
    );

    return new ThreddsStratum(catalogGroup, threddsCatalog);
  }

  @computed
  get members(): ModelReference[] {
    const memberIds: ModelReference[] = [];

    this.threddsCatalog.catalogs.forEach((catalog: ThreddsCatalog) => {
      memberIds.push(`${this._catalogGroup.uniqueId}/${catalog.id}`);
    });

    this.threddsCatalog.datasets.forEach((dataset: ThreddsDataset) => {
      dataset.catalogs.forEach(c => {
        memberIds.push(`${this._catalogGroup.uniqueId}/${c.id}`);
      });
      memberIds.push(`${this._catalogGroup.uniqueId}/${dataset.id}`);
    });
    return memberIds;
  }

  @action
  createThreddsCatalog(catalog: ThreddsCatalog) {
    const threddsGroup = new ThreddsCatalogGroup(
      `${this._catalogGroup.uniqueId}/${catalog.id}`,
      this._catalogGroup.terria
    );
    threddsGroup.setTrait("definition", "name", catalog.name);
    threddsGroup.setTrait("definition", "url", catalog.url);
    threddsGroup.terria.addModel(threddsGroup);
  }

  @action
  async createMembers() {
    // Create sub-groups for any nested catalogs
    for (let i = 0; i < this.threddsCatalog.catalogs.length; i++) {
      this.createThreddsCatalog(this.threddsCatalog.catalogs[i]);
    }

    // Create members for individual datasets
    for (let i = 0; i < this.threddsCatalog.datasets.length; i++) {
      const ds = this.threddsCatalog.datasets[i];

      for (let ii = 0; ii < ds.catalogs.length; ii++) {
        this.createThreddsCatalog(ds.catalogs[ii]);
      }

      if (ds.isParentDataset) {
        const fakeThreddsGroup = new CatalogGroup(
          `${this._catalogGroup.uniqueId}/${ds.id}`,
          this._catalogGroup.terria
        );
        fakeThreddsGroup.terria.addModel(fakeThreddsGroup);
        fakeThreddsGroup.setTrait("definition", "name", ds.name);
        ds.datasets.forEach(dataset => {
          const item = this.createMemberFromDataset(dataset);
          if (item !== undefined) fakeThreddsGroup.add("definition", item);
        });
      } else if (ds.supportsWms) this.createMemberFromDataset(ds);
    }
  }

  @action
  createMemberFromDataset(
    threddsDataset: ThreddsDataset
  ): BaseModel | undefined {
    if (!isDefined(threddsDataset.id)) {
      return undefined;
    }

    const id = this._catalogGroup.uniqueId;
    const itemId = id + "/" + threddsDataset.id;
    let item = this._catalogGroup.terria.getModelById(
      WebMapServiceCatalogGroup,
      itemId
    );
    if (item === undefined) {
      item = new WebMapServiceCatalogGroup(itemId, this._catalogGroup.terria);
      item.setTrait("definition", "name", threddsDataset.name);
      item.setTrait("definition", "url", threddsDataset.wmsUrl);
      // add the THREDDS dataset endpoint to infoSection - threddsDataset.url

      item.terria.addModel(item);
    }
    return item;
  }
}

StratumOrder.addLoadStratum(ThreddsStratum.stratumName);

export default class ThreddsCatalogGroup extends UrlMixin(
  GroupMixin(CatalogMemberMixin(CreateModel(ThreddsCatalogGroupTraits)))
) {
  static readonly type = "thredds-group";

  get type() {
    return ThreddsCatalogGroup.type;
  }

  get typeName() {
    return i18next.t("models.thredds.nameGroup");
  }

  @computed
  get cacheDuration(): string {
    if (isDefined(super.cacheDuration)) {
      return super.cacheDuration;
    }
    return "1d";
  }

  protected forceLoadMetadata(): Promise<void> {
    const threddsStratum = <ThreddsStratum | undefined>(
      this.strata.get(ThreddsStratum.stratumName)
    );
    if (!threddsStratum) {
      return ThreddsStratum.load(this).then(stratum => {
        if (stratum === undefined) return;
        runInAction(() => {
          this.strata.set(ThreddsStratum.stratumName, stratum);
        });
      });
    } else {
      return Promise.resolve();
    }
  }

  protected forceLoadMembers(): Promise<void> {
    return this.loadMetadata();
  }
}

// function createGroup(groupId: string, terria: Terria, groupName: string) {
//   const g = new CatalogGroup(groupId, terria);
//   g.setTrait("definition", "name", groupName);
//   terria.addModel(g);
//   return g;
// }

// function createUngroupedGroup(thredds: ThreddsStratum) {
//   const groupId = arcgisPortal._catalogGroup.uniqueId + "/ungrouped";
//   let existingGroup = arcgisPortal._catalogGroup.terria.getModelById(
//     CatalogGroup,
//     groupId
//   );
//   if (existingGroup === undefined) {
//     existingGroup = createGroup(
//       groupId,
//       arcgisPortal._catalogGroup.terria,
//       arcgisPortal._catalogGroup.ungroupedTitle
//     );
//   }
//   return [existingGroup];
// }

// function createGroupsByPortalGroups(arcgisPortal: ThreddsStratum) {
//   if (arcgisPortal._arcgisGroupResponse === undefined) return [];
//   const out: CatalogGroup[] = [];
//   arcgisPortal._arcgisGroupResponse.results.forEach(
//     (group: ArcGisPortalGroup) => {
//       const groupId = arcgisPortal._catalogGroup.uniqueId + "/" + group.id;
//       let existingGroup = arcgisPortal._catalogGroup.terria.getModelById(
//         CatalogGroup,
//         groupId
//       );
//       if (existingGroup === undefined) {
//         existingGroup = createGroup(
//           groupId,
//           arcgisPortal._catalogGroup.terria,
//           group.title
//         );
//         if (group.description) {
//           existingGroup.setTrait(
//             "definition",
//             "description",
//             group.description
//           );
//         }
//       }
//       out.push(existingGroup);
//     }
//   );
//   return out;
// }

// async function paginateThroughResults(
//   uri: any,
//   catalogGroup: ThreddsCatalogGroup
// ) {
//   const arcgisPortalResponse = await getPortalInformation(uri, catalogGroup);
//   if (arcgisPortalResponse === undefined || !arcgisPortalResponse) {
//     throw new TerriaError({
//       title: i18next.t("models.arcgisPortal.errorLoadingTitle"),
//       message: i18next.t("models.arcgisPortal.errorLoadingMessage", {
//         email:
//           '<a href="mailto:' +
//           catalogGroup.terria.supportEmail +
//           '">' +
//           catalogGroup.terria.supportEmail +
//           "</a>"
//       })
//     });
//     return;
//   }
//   let nextStart: number = arcgisPortalResponse.nextStart;
//   while (nextStart !== -1) {
//     nextStart = await getMoreResults(
//       uri,
//       catalogGroup,
//       arcgisPortalResponse,
//       nextStart
//     );
//   }
//   return arcgisPortalResponse;
// }

// async function getPortalInformation(
//   uri: any,
//   catalogGroup: ThreddsCatalogGroup
// ) {
//   try {
//     const response = await loadJson(
//       proxyCatalogItemUrl(
//         catalogGroup,
//         uri.toString(),
//         catalogGroup.cacheDuration
//       )
//     );
//     return response;
//   } catch (err) {
//     console.log(err);
//     return undefined;
//   }
// }

// async function getMoreResults(
//   uri: any,
//   catalogGroup: ThreddsCatalogGroup,
//   baseResults: ThreddsSearchResponse,
//   nextResultStart: number
// ) {
//   uri.setQuery("start", nextResultStart);
//   try {
//     const arcgisPortalResponse = await getPortalInformation(uri, catalogGroup);
//     if (arcgisPortalResponse === undefined) {
//       return -1;
//     }
//     baseResults.results = baseResults.results.concat(
//       arcgisPortalResponse.results
//     );
//     return arcgisPortalResponse.nextStart;
//   } catch (err) {
//     console.log(err);
//     return -1;
//   }
// }
