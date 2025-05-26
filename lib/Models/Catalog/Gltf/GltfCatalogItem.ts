import { action, computed, observable, makeObservable } from "mobx";
import GltfMixin from "../../../ModelMixins/GltfMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import GltfCatalogItemTraits from "../../../Traits/TraitsClasses/GltfCatalogItemTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import { ModelConstructorParameters } from "../../Definition/Model";
import HasLocalData from "../../HasLocalData";
import CesiumIonMixin from "../../../ModelMixins/CesiumIonMixin";

export default class GltfCatalogItem
  extends UrlMixin(
    CesiumIonMixin(GltfMixin(CreateModel(GltfCatalogItemTraits)))
  )
  implements HasLocalData
{
  static readonly type = "gltf";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return GltfCatalogItem.type;
  }

  @computed
  get gltfModelUrl() {
    if (this.ionResource) {
      return this.ionResource;
    } else {
      return this.url;
    }
  }

  protected override forceLoadMetadata(): Promise<void> {
    return this.loadIonResource();
  }

  @observable hasLocalData = false;

  @action
  setFileInput(file: File | Blob) {
    const dataUrl = URL.createObjectURL(file);
    this.setTrait(CommonStrata.user, "url", dataUrl);
    this.hasLocalData = true;
  }
}
