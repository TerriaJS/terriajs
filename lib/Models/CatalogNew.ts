import { observable } from "mobx";
import { USER_ADDED_CATEGORY_NAME } from "../Core/addedByUser";
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

    // create user added data group
    this.userAddedDataGroup;
  }

  get userAddedDataGroup(): CatalogGroup {
    let group = this.userAddedDataGroupIfItExists;
    if (isDefined(group)) {
      return group;
    }

    // check for the case where user added data group exists but was
    // removed from this.group.memberModels after catalog members were reset
    group = <CatalogGroup | undefined>(
      this.terria.getModelById(BaseModel, USER_ADDED_CATEGORY_NAME)
    );
    if (isDefined(group)) {
      this.group.add(CommonStrata.definition, group);
      return group;
    }

    group = new CatalogGroup(USER_ADDED_CATEGORY_NAME, this.terria);
    group.setTrait(CommonStrata.definition, "name", USER_ADDED_CATEGORY_NAME);
    group.setTrait(
      CommonStrata.definition,
      "description",
      "The group for data that was added by the user via the Add Data panel."
    );
    this.terria.addModel(group);
    this.group.add(CommonStrata.definition, group);
    return group;
  }

  get userAddedDataGroupIfItExists(): CatalogGroup | undefined {
    const group = this.group.memberModels.find(
      m => m.uniqueId === USER_ADDED_CATEGORY_NAME
    );
    return <CatalogGroup | undefined>group;
  }
}
