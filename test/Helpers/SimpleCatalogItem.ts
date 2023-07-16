import { observable } from "mobx";
import CatalogMemberMixin from "../../lib/ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../lib/ModelMixins/MappableMixin";
import CreateModel from "../../lib/Models/Definition/CreateModel";
import mixTraits from "../../lib/Traits/mixTraits";
import CatalogMemberTraits from "../../lib/Traits/TraitsClasses/CatalogMemberTraits";
import MappableTraits from "../../lib/Traits/TraitsClasses/MappableTraits";
import UrlTraits from "../../lib/Traits/TraitsClasses/UrlTraits";

export default class SimpleCatalogItem extends CatalogMemberMixin(
  MappableMixin(
    CreateModel(mixTraits(UrlTraits, MappableTraits, CatalogMemberTraits))
  )
) {
  @observable _private_mapItems: MapItem[] = [];

  override _protected_forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }

  override get mapItems(): MapItem[] {
    return this._private_mapItems;
  }
}
