import CreateModel from "./CreateModel";
import ModelTraits from "../Traits/ModelTraits";
import anyTrait from "../Traits/anyTrait";
import { JsonObject } from "../Core/Json";
import { BaseModel } from "./Model";
import upsertModelFromJson from "./upsertModelFromJson";
import CatalogMemberFactory from "./CatalogMemberFactory";
import CommonStrata from "./CommonStrata";
import { computed } from "mobx";
import Mappable, { MapItem } from "./Mappable";

export class CompositeTraits extends ModelTraits {
  @anyTrait({
    name: "Items",
    description: "The items in this composite."
  })
  items?: JsonObject[];
}

export default class CompositeCatalogItem extends CreateModel(CompositeTraits) {
  static readonly type = "composite";
  get type() {
    return CompositeCatalogItem.type;
  }

  @computed
  get models(): readonly BaseModel[] {
    return this.items.map(item => {
      return upsertModelFromJson(
        CatalogMemberFactory,
        this.terria,
        this.uniqueId || "",
        undefined,
        CommonStrata.underride,
        item,
        true
      );
    });
  }

  @computed
  get mapItems(): readonly MapItem[] {
    const result: MapItem[] = [];
    this.models.forEach(model => {
      if (Mappable.is(model)) {
        result.push(...model.mapItems);
      }
    });
    return result;
  }

  loadMapItems(): Promise<void> {
    return Promise.all(this.models.map(model => {
      if (Mappable.is(model)) {
        return model.loadMapItems();
      } else {
        return Promise.resolve();
      }
    })).then(() => {});
  }
}
