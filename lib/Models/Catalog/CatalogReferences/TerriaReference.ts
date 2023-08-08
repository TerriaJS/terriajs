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
    const excludedMembers =
      (this.itemPropertiesByType?.find(
        (itemProps) => itemProps.type === TerriaReference.type
      )?.itemProperties?.excludeMembers as string[]) ?? [];

    const path = this.path ? this.path.slice() : undefined;

    // Load the entire catalog members as a group or find the group/item to load at the path
    targetJson = findCatalogMemberJson(initJson.catalog, path, excludedMembers);
    if (this.path === undefined) {
      targetJson.type = "group";
      targetJson.name = this.name;
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

function filterMembers(members: any, excludeMembers: string[]) {
  members.forEach((member: any) => {
    if (member.type === "group") {
      member.members = member.members.filter(
        (m: any) => !excludeMembers.includes(m.id)
      );
      filterMembers(member.members, excludeMembers);
    }
  });
}

/**
 * Returns a filtered catalog member JSON at the specified path or all if the path doesn't exist.
 */
function findCatalogMemberJson(
  catalogMembers: any[],
  path: string[] | undefined,
  excludeMembers: string[]
): JsonObject | undefined {
  const member = path
    ? path.reduce(
        (group, id) => {
          if (Array.isArray(group?.members)) {
            return group.members.find((m) => m?.id === id);
          } else {
            return undefined;
          }
        },
        { members: catalogMembers }
      )
    : { members: catalogMembers };

  // Exclude unwanted items in terria reference catalog.
  const filteredMembers =
    excludeMembers.length > 0
      ? member.members.filter((m) => !excludeMembers.includes(m.id))
      : member.members;

  // Exclude unwanted members in dereferenced groups.
  if (excludeMembers.length > 0) filterMembers(filteredMembers, excludeMembers);

  member.members = filteredMembers;
  return member;
}
