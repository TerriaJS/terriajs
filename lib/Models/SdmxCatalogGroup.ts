import { computed, runInAction } from "mobx";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../ModelMixins/GroupMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import ModelReference from "../Traits/ModelReference";
import SdmxCatalogGroupTraits from "../Traits/SdmxCatalogGroupTraits";
import CreateModel from "./CreateModel";
import LoadableStratum from "./LoadableStratum";
import { BaseModel } from "./Model";
import StratumOrder from "./StratumOrder";
import loadJson from "../Core/loadJson";

export class SdmxServerStratum extends LoadableStratum(SdmxCatalogGroupTraits) {
  static stratumName = "sdmxServer";

  constructor(readonly _catalogGroup: SdmxCatalogGroup) {
    super();
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new SdmxServerStratum(model as SdmxCatalogGroup) as this;
  }

  static async load(
    catalogGroup: SdmxCatalogGroup
  ): Promise<SdmxServerStratum> {
    const agencyScheme = await loadJson(
      "https://stats-nsi-stable.pacificdata.org/rest/agencyscheme/"
    );

    console.log(agencyScheme);
    return new SdmxServerStratum(catalogGroup);
  }

  @computed
  get members(): ModelReference[] {
    return [];
  }
}

StratumOrder.addLoadStratum(SdmxServerStratum.stratumName);

export default class SdmxCatalogGroup extends UrlMixin(
  GroupMixin(CatalogMemberMixin(CreateModel(SdmxCatalogGroupTraits)))
) {
  static readonly type = "sdmx-group";

  get type() {
    return SdmxCatalogGroup.type;
  }

  protected forceLoadMetadata(): Promise<void> {
    return SdmxServerStratum.load(this).then(stratum => {
      runInAction(() => {
        this.strata.set(SdmxServerStratum.stratumName, stratum);
      });
    });
  }

  protected forceLoadMembers(): Promise<void> {
    return this.loadMetadata().then(() => {
      const getCapabilitiesStratum = <SdmxServerStratum | undefined>(
        this.strata.get(SdmxServerStratum.stratumName)
      );
      // if (getCapabilitiesStratum) {
      //   getCapabilitiesStratum.createMembersFromLayers();
      // }
    });
  }
}
