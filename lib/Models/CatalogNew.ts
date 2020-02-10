import i18next from "i18next";
import { observable } from "mobx";
import { USER_ADDED_CATEGORY_ID } from "../Core/addedByUser";
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
    this.terria.addModel(this.group);

    const userAddedDataGroup = new CatalogGroup(
      USER_ADDED_CATEGORY_ID,
      this.terria
    );
    const userAddedGroupName: string = i18next.t("core.userAddedData");
    userAddedDataGroup.setTrait(
      CommonStrata.definition,
      "name",
      userAddedGroupName
    );
    const userAddedGroupDescription: string = i18next.t(
      "models.catalog.userAddedDataGroup"
    );
    userAddedDataGroup.setTrait(
      CommonStrata.definition,
      "description",
      userAddedGroupDescription
    );

    this.terria.addModel(userAddedDataGroup);
    this.group.add(CommonStrata.definition, userAddedDataGroup);
  }

  get userAddedDataGroup(): CatalogGroup {
    const group = this.group.memberModels.find(
      m => m.uniqueId === USER_ADDED_CATEGORY_ID
    );
    return <CatalogGroup>group;
  }
}
