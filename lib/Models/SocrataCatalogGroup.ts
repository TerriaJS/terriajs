import { action, computed, runInAction } from "mobx";
import URI from "urijs";
import loadJson from "../Core/loadJson";
import runLater from "../Core/runLater";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../ModelMixins/GroupMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import ModelReference from "../Traits/ModelReference";
import SocrataCatalogGroupTraits from "../Traits/TraitsClasses/SocrataCatalogGroupTraits";
import CatalogGroup from "./CatalogGroupNew";
import CommonStrata from "./CommonStrata";
import CreateModel from "./CreateModel";
import LoadableStratum from "./LoadableStratum";
import { BaseModel } from "./Model";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import StratumOrder from "./StratumOrder";

export interface Facet {
  facet: string;
  count: number;
  values: { value: string; count: number }[];
}

export class SocrataCatalogStratum extends LoadableStratum(
  SocrataCatalogGroupTraits
) {
  static stratumName = "socrataCatalog";

  static async load(
    catalogGroup: SocrataCatalogGroup
  ): Promise<SocrataCatalogStratum> {
    if (!catalogGroup.url) throw "`url` must be set";

    const domain = URI(catalogGroup.url).hostname();

    const facets = (await loadJson(
      proxyCatalogItemUrl(
        catalogGroup,
        `${catalogGroup.url}/api/catalog/v1/domains/${domain}/facets`
      )
    )) as Facet[];

    if (!Array.isArray(facets))
      throw `Could not fetch facets for domain ${domain}`;

    if (facets.length === 0)
      throw `Could not find any facets for domain ${domain}`;

    return new SocrataCatalogStratum(catalogGroup, facets);
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new SocrataCatalogStratum(
      model as SocrataCatalogGroup,
      this.facets
    ) as this;
  }
  constructor(
    private readonly catalogGroup: SocrataCatalogGroup,
    private readonly facets: Facet[]
  ) {
    super();
  }

  @computed
  get members(): ModelReference[] {
    return this.facets.map(f => this.getFacetId(f));
  }

  createMembers() {
    this.facets.forEach(facet => this.createGroupFromFacet(facet));
  }

  /** Turn facet into SocrataCatalogGroup */
  @action
  createGroupFromFacet(facet: Facet) {
    const facetGroupId = this.getFacetId(facet);

    // Create group for Facet
    let facetGroup = this.catalogGroup.terria.getModelById(
      CatalogGroup,
      facetGroupId
    );
    if (facetGroup === undefined) {
      facetGroup = new CatalogGroup(
        facetGroupId,
        this.catalogGroup.terria,
        undefined
      );
      this.catalogGroup.terria.addModel(facetGroup);
    }

    // Replace the stratum inherited from the parent group.
    const stratum = CommonStrata.underride;
    facetGroup.strata.delete(stratum);

    facetGroup.setTrait(stratum, "name", facet.facet);

    // Create child groups for Facet values
    facet.values.forEach(facetValue => {
      const facetValueId = `${facetGroupId}/${facetValue.value}`;

      let facetValueGroup = this.catalogGroup.terria.getModelById(
        CatalogGroup,
        facetValueId
      );
      if (facetValueGroup === undefined) {
        facetValueGroup = new CatalogGroup(
          facetValueId,
          this.catalogGroup.terria,
          undefined
        );
        this.catalogGroup.terria.addModel(facetValueGroup);
      }

      // Replace the stratum inherited from the parent group.
      const stratum = CommonStrata.underride;
      facetValueGroup.strata.delete(stratum);

      facetValueGroup.setTrait(
        stratum,
        "name",
        `${facetValue.value}${
          facetValue.count ? ` (${facetValue.count ?? 0})` : ""
        }`
      );

      facetGroup!.add(CommonStrata.underride, facetValueGroup);
    });
  }

  getFacetId(facet: Facet) {
    return `${this.catalogGroup.uniqueId}/${facet.facet}`;
  }
}

StratumOrder.addLoadStratum(SocrataCatalogStratum.stratumName);

export default class SocrataCatalogGroup extends UrlMixin(
  GroupMixin(CatalogMemberMixin(CreateModel(SocrataCatalogGroupTraits)))
) {
  static readonly type = "socrata-group";

  get type() {
    return SocrataCatalogGroup.type;
  }

  protected async forceLoadMetadata(): Promise<void> {
    if (!this.strata.has(SocrataCatalogStratum.stratumName)) {
      const stratum = await SocrataCatalogStratum.load(this);
      runInAction(() => {
        this.strata.set(SocrataCatalogStratum.stratumName, stratum);
      });
    }
  }

  protected async forceLoadMembers() {
    const socrataServerStratum = <SocrataCatalogStratum | undefined>(
      this.strata.get(SocrataCatalogStratum.stratumName)
    );
    if (socrataServerStratum) {
      await runLater(() => socrataServerStratum.createMembers());
    }
  }
}
