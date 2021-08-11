import { runInAction } from "mobx";
import runLater from "../../../Core/runLater";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../../../ModelMixins/GroupMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import SdmxCatalogGroupTraits from "../../../Traits/TraitsClasses/SdmxCatalogGroupTraits";
import CreateModel from "../../Definition/CreateModel";
import { SdmxServerStratum } from "./SdmxJsonServerStratum";

export default class SdmxCatalogGroup extends UrlMixin(
  GroupMixin(CatalogMemberMixin(CreateModel(SdmxCatalogGroupTraits)))
) {
  static readonly type = "sdmx-group";

  get type() {
    return SdmxCatalogGroup.type;
  }

  protected async forceLoadMetadata(): Promise<void> {
    if (!this.strata.has(SdmxServerStratum.stratumName)) {
      const stratum = await SdmxServerStratum.load(this);
      runInAction(() => {
        this.strata.set(SdmxServerStratum.stratumName, stratum);
      });
    }
  }

  protected async forceLoadMembers() {
    const sdmxServerStratum = <SdmxServerStratum | undefined>(
      this.strata.get(SdmxServerStratum.stratumName)
    );
    if (sdmxServerStratum) {
      await runLater(() => sdmxServerStratum.createMembers());
    }
  }
}
