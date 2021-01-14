import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import { BaseMapViewModel } from "../../ViewModels/BaseMapViewModel";
import BingMapsCatalogItem from "../BingMapsCatalogItem";
import CatalogMemberFactory from "../CatalogMemberFactory";
import CommonStrata from "../CommonStrata";
import Mappable from "../Mappable";
import { BaseModel } from "../Model";
import Terria from "../Terria";
import upsertModelFromJson from "../upsertModelFromJson";
import IonImageryCatalogItem from "./../../../dist/Models/IonImageryCatalogItem";

export interface BaseMapModel {
  image: string;
  item: BaseModel;
}

export function processBaseMaps(baseMaps: BaseMapModel[], terria: Terria) {
  baseMaps.forEach(baseMap => {
    const item = baseMap.item;
    if (item.type === BingMapsCatalogItem.type && !(<any>item).key) {
      (<any>item).key = terria.configParameters.bingMapsKey;
    } else if (item.type === IonImageryCatalogItem.type) {
      (<any>item).key = terria.configParameters.bingMapsKey;
    }
    const model = upsertModelFromJson(
      CatalogMemberFactory,
      terria,
      "/basemap/",
      CommonStrata.definition,
      baseMap.item,
      {
        addModelToTerria: true
      }
    );
    if (Mappable.is(model)) {
      if (CatalogMemberMixin.isMixedInto(model)) model.loadMetadata();
      terria.baseMaps.push(new BaseMapViewModel(model, baseMap.image));
    }
  });
}
