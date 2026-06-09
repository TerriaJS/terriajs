import i18next from "i18next";
import { flow } from "mobx";
import isDefined from "../../../Core/isDefined";
import { isJsonObject, JsonObject } from "../../../Core/Json";
import loadJson5 from "../../../Core/loadJson5";
import TerriaError from "../../../Core/TerriaError";
import GroupMixin from "../../../ModelMixins/GroupMixin";
import ReferenceMixin from "../../../ModelMixins/ReferenceMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import TerriaReferenceTraits from "../../../Traits/TraitsClasses/TerriaReferenceTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import { BaseModel } from "../../Definition/Model";
import updateModelFromJson from "../../Definition/updateModelFromJson";
import CatalogMemberFactory from "../CatalogMemberFactory";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

/**
 * A reference to another terria catalog.
 *
 * Terria reference can be used to load a group, an item or all members of
 * another terria catalog (also known as an init file).
 *
 * If `path`:
 *   - is specified, it must be an array of IDs giving the path of the item to load in the target catalog tree.
 *   - is not specified, we show all members of the catalog under the reference item.
 *
 * `isGroup` must be set to `true` if the target item is a group.
 *
 */
export default class TerriaReference extends UrlMixin(
  ReferenceMixin(CreateModel(TerriaReferenceTraits))
) {
  static readonly type = "terria-reference";

  get type() {
    return TerriaReference.type;
  }

  protected forceLoadReference = flow(function* (
    this: TerriaReference,
    _previousTarget: BaseModel | undefined
  ) {
    if (this.url === undefined || this.uniqueId === undefined) {
      return undefined;
    }

    const initJson = yield loadJson5(
      proxyCatalogItemUrl(this, this.url, this.cacheDuration)
    );

    if (!isJsonObject(initJson) || !Array.isArray(initJson.catalog)) {
      return;
    }

    let targetJson: any;
    if (this.path) {
      // Find the group/item to load at the path
      targetJson = findCatalogMemberJson(initJson.catalog, this.path.slice());
    } else {
      // Load the entire catalog members as a group
      targetJson = {
        type: "group",
        members: initJson.catalog,
        name: this.name
      };
    }

    if (typeof targetJson?.type === "string") {
      const target = CatalogMemberFactory.create(
        targetJson.type,
        this.uniqueId,
        this.terria,
        this
      );

      if (target === undefined) {
        throw new TerriaError({
          sender: this,
          title: i18next.t("models.catalog.unsupportedTypeTitle"),
          message: i18next.t("models.catalog.unsupportedTypeMessage", {
            type: `"${targetJson.type}"`
          })
        });
      } else {
        if (targetJson.name !== undefined) {
          // Override the target's name with the name of this reference.
          // This avoids the name of the catalog suddenly changing after the reference is loaded.
          targetJson.name = this.name;
        }
        // Override `GroupTraits` if targetJson is a group

        if (
          GroupMixin.isMixedInto(target) &&
          isDefined(targetJson.isOpen) &&
          typeof targetJson.isOpen === "boolean"
        ) {
          target.setTrait(
            CommonStrata.definition,
            "isOpen",
            targetJson.isOpen as boolean
          );
        }

        updateModelFromJson(
          target,
          CommonStrata.definition,
          targetJson
        ).catchError((error) => {
          target.setTrait(CommonStrata.underride, "isExperiencingIssues", true);
          error.log();
        });
        return target;
      }
    }

    throw new TerriaError({
      sender: this,
      title: i18next.t("models.terria-reference.failedToLoadTarget"),
      message: i18next.t("models.terria-reference.failedToLoadTarget")
    });
  });
}

/**
 * Returns a catalog member JSON at the specified path or undefined if it doesn't exist.
 */
function findCatalogMemberJson(
  catalogMembers: any[],
  path: string[]
): JsonObject | undefined {
  const member = path.reduce(
    (group, id) => {
      if (Array.isArray(group?.members)) {
        return group.members.find((m) => m?.id === id);
      } else {
        return undefined;
      }
    },
    { members: catalogMembers }
  );
  return member;
}
