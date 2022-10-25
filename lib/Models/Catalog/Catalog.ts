import i18next from "i18next";
import { autorun, observable } from "mobx";
import { USER_ADDED_CATEGORY_ID } from "../../Core/addedByUser";
import CatalogGroup from "./CatalogGroup";
import CommonStrata from "../Definition/CommonStrata";
import Terria from "../Terria";
import Group from "./Group";
import { BaseModel } from "../Definition/Model";
import isDefined from "../../Core/isDefined";

export default class Catalog {
  @observable
  group: Group & BaseModel;

  readonly terria: Terria;

  private _disposeCreateUserAddedGroup: () => void;

  constructor(terria: Terria) {
    this.terria = terria;
    this.group = new CatalogGroup("/", this.terria);
    this.terria.addModel(this.group);

    this._disposeCreateUserAddedGroup = autorun(() => {
      // Make sure the catalog has a user added data group even if its
      // group or group members are reset.
      if (
        !this.group.memberModels.find(
          (m) => m.uniqueId === USER_ADDED_CATEGORY_ID
        )
      ) {
        let userAddedDataGroup = this.terria.getModelById(
          BaseModel,
          USER_ADDED_CATEGORY_ID
        );

        if (!isDefined(userAddedDataGroup)) {
          userAddedDataGroup = new CatalogGroup(
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
        }

        this.group.add(CommonStrata.definition, userAddedDataGroup);
      }
    });
  }

  destroy() {
    this._disposeCreateUserAddedGroup();
  }

  get userAddedDataGroup(): CatalogGroup {
    const group = this.group.memberModels.find(
      (m) => m.uniqueId === USER_ADDED_CATEGORY_ID
    );
    return <CatalogGroup>group;
  }
}
