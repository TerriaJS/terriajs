import { runInAction } from "mobx";
import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../../ModelMixins/GroupMixin";
import UrlMixin from "../../ModelMixins/UrlMixin";
import SdmxCatalogGroupTraits from "../../Traits/SdmxCatalogGroupTraits";
import CreateModel from "../CreateModel";
import { SdmxServerStratum } from "./SdmxJsonServerStratum";

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
