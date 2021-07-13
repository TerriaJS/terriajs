import i18next from "i18next";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import getDereferencedIfExists from "../../Core/getDereferencedIfExists";
import isDefined from "../../Core/isDefined";
import TerriaError from "../../Core/TerriaError";
import GroupMixin from "../../ModelMixins/GroupMixin";
import GroupTraits from "../../Traits/TraitsClasses/GroupTraits";
import CommonStrata from "../Definition/CommonStrata";
import hasTraits from "../Definition/hasTraits";
import { BaseModel } from "../Definition/Model";
import Terria from "../Terria";

interface AddUserCatalogMemberOptions {
  enable?: boolean;
  open?: boolean;
}

/**
 * Adds a user's catalog item or group to the catalog.
 *
 */
export default function addUserCatalogMember(
  terria: Terria,
  newCatalogMemberOrPromise: BaseModel | Promise<BaseModel | undefined>,
  options: AddUserCatalogMemberOptions = {}
): Promise<BaseModel | undefined> {
  const promise =
    newCatalogMemberOrPromise instanceof Promise
      ? newCatalogMemberOrPromise
      : Promise.resolve(newCatalogMemberOrPromise);

  return promise
    .then((newCatalogItem?: BaseModel) => {
      if (!isDefined(newCatalogItem)) {
        return;
      }

      terria.catalog.userAddedDataGroup.setTrait(
        CommonStrata.user,
        "isOpen",
        true
      );
      terria.catalog.userAddedDataGroup.add(CommonStrata.user, newCatalogItem);

      const dereferenced = getDereferencedIfExists(newCatalogItem);

      if (
        isDefined(options.open) &&
        hasTraits(dereferenced, GroupTraits, "isOpen")
      ) {
        dereferenced.setTrait(CommonStrata.user, "isOpen", true);
      }

      if (
        defaultValue(options.enable, true) &&
        !GroupMixin.isMixedInto(dereferenced)
      ) {
        terria.workbench.add(dereferenced);
      }

      return newCatalogItem;
    })
    .catch((e: any) => {
      if (!(e instanceof TerriaError)) {
        e = new TerriaError({
          title: i18next.t("models.userData.addingDataErrorTitle"),
          message: i18next.t("models.userData.addingDataErrorTitle")
        });
      }

      terria.raiseErrorToUser(e);
      return e;
    });
}
