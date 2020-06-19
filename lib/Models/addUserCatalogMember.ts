import i18next from "i18next";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import getDereferencedIfExists from "../Core/getDereferencedIfExists";
import isDefined from "../Core/isDefined";
import TerriaError from "../Core/TerriaError";
import GroupMixin from "../ModelMixins/GroupMixin";
import GroupTraits from "../Traits/GroupTraits";
import CommonStrata from "./CommonStrata";
import hasTraits from "./hasTraits";
import Mappable from "./Mappable";
import { BaseModel } from "./Model";
import Terria from "./Terria";

interface AddUserCatalogMemberOptions {
  enable?: boolean;
  open?: boolean;
  zoomTo?: boolean;
}

/**
 * Adds a user's catalog item or group to the catalog.
 *
 */
export default function addUserCatalogMember(
  terria: Terria,
  newCatalogMemberOrPromise: BaseModel | Promise<BaseModel | undefined>,
  options: AddUserCatalogMemberOptions = {}
) {
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
        // add to workbench if it doesn't hold an item by the same id
        if (
          !terria.workbench.items.find(
            item => item.uniqueId === dereferenced.uniqueId
          )
        ) {
          terria.workbench.add(dereferenced);
        }
      }

      if (defaultValue(options.zoomTo, true) && Mappable.is(dereferenced)) {
        dereferenced
          .loadMapItems()
          .then(() => terria.currentViewer.zoomTo(dereferenced, 1));
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

      terria.error.raiseEvent(e);
      return e;
    });
}
