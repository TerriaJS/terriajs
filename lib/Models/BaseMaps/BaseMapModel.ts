import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import { BaseMapViewModel } from "../../ViewModels/BaseMapViewModel";
import BingMapsCatalogItem from "../BingMapsCatalogItem";
import CatalogMemberFactory from "../CatalogMemberFactory";
import CommonStrata from "../CommonStrata";
import Mappable from "../Mappable";
import { BaseModel } from "../Model";
import Terria from "../Terria";
import upsertModelFromJson from "../upsertModelFromJson";
import BingMapsCatalogItemTraits from "./../../Traits/BingMapsCatalogItemTraits";

export interface BaseMapModel {
  image: string;
  item: BaseModel;
}

export function processBaseMaps(newBaseMaps: BaseMapModel[], terria: Terria) {
  newBaseMaps.forEach(newBaseMap => {
    const item = newBaseMap.item;
    if (!item) {
      console.log("basemap is missing the item property.");
      return;
    }
    if (
      terria.baseMaps.some(
        baseMap => baseMap.mappable.uniqueId === (<any>newBaseMap.item).id
      )
    ) {
      return;
    }

    if (item.type === BingMapsCatalogItem.type) {
      addBingMapsKey(item, terria);
    }
    const model = upsertModelFromJson(
      CatalogMemberFactory,
      terria,
      "/basemap/",
      CommonStrata.definition,
      newBaseMap.item,
      {
        addModelToTerria: true
      }
    );
    if (Mappable.is(model)) {
      if (CatalogMemberMixin.isMixedInto(model)) model.loadMetadata();
      terria.baseMaps.push(new BaseMapViewModel(model, newBaseMap.image));
    }
  });
}

function addBingMapsKey(item: any, terria: Terria) {
  if (!item.key) {
    item.key = terria.configParameters.bingMapsKey;
  }
}
