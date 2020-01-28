import i18next from "i18next";
import { observable } from "mobx";
import { USER_ADDED_CATEGORY_ID } from "../Core/addedByUser";
import isDefined from "../Core/isDefined";
import CatalogGroup from "./CatalogGroupNew";
import CommonStrata from "./CommonStrata";
import Terria from "./Terria";
import Group from "./Group";
import { BaseModel } from "./Model";

export default class Catalog {
  @observable
  group: Group & BaseModel;

  readonly terria: Terria;

  constructor(terria: Terria) {
    this.terria = terria;
    this.group = new CatalogGroup("/", this.terria);
  }

  get userAddedDataGroup(): CatalogGroup {
    let group = this.userAddedDataGroupIfItExists;
    if (isDefined(group)) {
      return group;
    }
    group = new CatalogGroup(USER_ADDED_CATEGORY_ID, this.terria);
    const userAddedGroupName: string = i18next.t("core.userAddedData");
    group.setTrait(CommonStrata.definition, "name", userAddedGroupName);
    const userAddedGroupDescription: string = i18next.t(
      "models.catalog.userAddedDataGroup"
    );
    group.setTrait(
      CommonStrata.definition,
      "description",
      userAddedGroupDescription
    );
    this.terria.addModel(group);
    this.group.add(CommonStrata.definition, group);
    return group;
  }

  get userAddedDataGroupIfItExists(): CatalogGroup | undefined {
    const group = this.group.memberModels.find(
      m => m.uniqueId === USER_ADDED_CATEGORY_ID
    );
    return <CatalogGroup | undefined>group;
  }
}
