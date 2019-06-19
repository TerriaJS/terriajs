import Terria from "./Terria";
import CatalogGroup from "./CatalogGroupNew";
import { computed } from "mobx";
import { USER_ADDED_CATEGORY_NAME } from "../Core/addedByUser";
import isDefined from "../Core/isDefined";
import hasTraits from "./hasTraits";
import CatalogMemberTraits from "../Traits/CatalogMemberTraits";
import Model, { BaseModel } from "./Model";
import CommonStrata from "./CommonStrata";
import ModelReference from "../Traits/ModelReference";

export default class Catalog {
  readonly group: CatalogGroup;
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
