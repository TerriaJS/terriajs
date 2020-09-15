import i18next from "i18next";
import { action, computed, runInAction } from "mobx";
import threddsCrawler from "thredds-catalog-crawler/src/entryBrowser";
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
import CommonStrata from "./CommonStrata";

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
    threddsGroup.setTrait(CommonStrata.definition, "name", catalog.name);
    threddsGroup.setTrait(CommonStrata.definition, "url", catalog.url);
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
        fakeThreddsGroup.setTrait(CommonStrata.definition, "name", ds.name);
        ds.datasets.forEach(dataset => {
          const item = this.createMemberFromDataset(dataset);
          if (item !== undefined)
            fakeThreddsGroup.add(CommonStrata.definition, item);
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
      item.setTrait(CommonStrata.definition, "name", threddsDataset.name);
      item.setTrait(CommonStrata.definition, "url", threddsDataset.wmsUrl);
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
