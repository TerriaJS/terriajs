import { uniq } from "lodash-es";
import { action, computed, runInAction } from "mobx";
import clone from "terriajs-cesium/Source/Core/clone";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import AsyncLoader from "../Core/AsyncLoader";
import Constructor from "../Core/Constructor";
import filterOutUndefined from "../Core/filterOutUndefined";
import flatten from "../Core/flatten";
import isDefined from "../Core/isDefined";
import { isJsonNumber, isJsonString, JsonObject } from "../Core/Json";
import Result from "../Core/Result";
import CatalogMemberFactory from "../Models/Catalog/CatalogMemberFactory";
import Group from "../Models/Catalog/Group";
import CommonStrata from "../Models/Definition/CommonStrata";
import hasTraits, { HasTrait } from "../Models/Definition/hasTraits";
import Model, { BaseModel } from "../Models/Definition/Model";
import ModelReference from "../Traits/ModelReference";
import GroupTraits from "../Traits/TraitsClasses/GroupTraits";
import { ItemPropertiesTraits } from "../Traits/TraitsClasses/ItemPropertiesTraits";
import CatalogMemberMixin, { getName } from "./CatalogMemberMixin";
import ReferenceMixin from "./ReferenceMixin";

const naturalSort = require("javascript-natural-sort");
naturalSort.insensitive = true;

const MERGED_GROUP_ID_PREPEND = "__merged__";

function GroupMixin<T extends Constructor<Model<GroupTraits>>>(Base: T) {
  abstract class Klass extends Base implements Group {
    private _memberLoader = new AsyncLoader(this.forceLoadMembers.bind(this));

    get isGroup() {
      return true;
    }

    /**
     * Gets a value indicating whether the set of members is currently loading.
     */
    get isLoadingMembers(): boolean {
      return this._memberLoader.isLoading;
    }

    get loadMembersResult() {
      return this._memberLoader.result;
    }

    /** Get merged excludeMembers from all parent groups. This will go through all knownContainerUniqueIds and merge all excludeMembers arrays */
    @computed get mergedExcludeMembers(): string[] {
      const blacklistSet = new Set(this.excludeMembers ?? []);

      this.knownContainerUniqueIds.forEach((containerId) => {
        const container = this.terria.getModelById(BaseModel, containerId);
        if (container && GroupMixin.isMixedInto(container)) {
          container.mergedExcludeMembers.forEach((s) => blacklistSet.add(s));
        }
      });

      return Array.from(blacklistSet);
    }

    @computed
    get memberModels(): ReadonlyArray<BaseModel> {
      const members = this.members;
      if (members === undefined) {
        return [];
      }
      const models = filterOutUndefined(
        members.map((id) => {
          if (!ModelReference.isRemoved(id)) {
            const model = this.terria.getModelById(BaseModel, id);
            if (this.mergedExcludeMembers.length == 0) {
              return model;
            }

            // Get model name and apply excludeMembers
            const modelName = CatalogMemberMixin.isMixedInto(model)
              ? model.name
              : undefined;
            if (
              model &&
              // Does excludeMembers not include model ID
              !this.mergedExcludeMembers.find(
                (name) =>
                  model.uniqueId?.toLowerCase().trim() ===
                  name.toLowerCase().trim()
              ) &&
              // Does excludeMembers not include model name
              (!modelName ||
                !this.mergedExcludeMembers.find(
                  (name) =>
                    modelName.toLowerCase().trim() === name.toLowerCase().trim()
                ))
            )
              return model;
          }
        })
      );

      // Sort members if necessary
      // Check if trait "this.sortMembersBy" exists and is a string or number
      // If not, then the model will be placed at the end of the array
      if (isDefined(this.sortMembersBy)) {
        return models.sort((a, b) => {
          const aValue = getSortProperty(a, this.sortMembersBy!);
          const bValue = getSortProperty(b, this.sortMembersBy!);
          return naturalSort(
            isJsonString(aValue) || isJsonNumber(aValue) ? aValue : Infinity,
            isJsonString(bValue) || isJsonNumber(bValue) ? bValue : Infinity
          );
        });
      }

      return models;
    }

    /**
     * Load the group members if necessary. Returns an existing promise
     * if the members are already loaded or if loading is already in progress,
     * so it is safe and performant to call this function as often as
     * necessary. When the promise returned by this function resolves, the
     * list of members in `GroupMixin#members` and `GroupMixin#memberModels`
     * should be complete, but the individual members will not necessarily be
     * loaded themselves.
     *
     * This returns a Result object, it will contain errors if they occur - they will not be thrown.
     * To throw errors, use `(await loadMetadata()).throwIfError()`
     *
     * {@see AsyncLoader}
     */
    async loadMembers(): Promise<Result<void>> {
      try {
        // Call loadMetadata if CatalogMemberMixin
        if (CatalogMemberMixin.isMixedInto(this))
          (await this.loadMetadata()).throwIfError();

        // Call Group AsyncLoader if no errors occurred while loading metadata
        (await this._memberLoader.load()).throwIfError();

        // Order here is important, as mergeGroupMembersByName will create models and the following functions will be applied on memberModels
        this.mergeGroupMembersByName();
        this.refreshKnownContainerUniqueIds(this.uniqueId);
        this.addShareKeysToMembers();
        this.addItemPropertiesToMembers();
      } catch (e) {
        return Result.error(e, `Failed to load group \`${getName(this)}\``);
      }

      return Result.none();
    }

    /**
     * Forces load of the group members. This method does _not_ need to consider
     * whether the group members are already loaded. When the promise returned
     * by this function resolves, the list of members in `GroupMixin#members`
     * and `GroupMixin#memberModels` should be complete, but the individual
     * members will not necessarily be loaded themselves.
     *
     * If creating new models (eg WebMapServiceCatalogGroup), use `CommonStrata.definition` for trait values.
     *
     * It is guaranteed that `loadMetadata` has finished before this is called.
     *
     * You **can not** make changes to observables until **after** an asynchronous call {@see AsyncLoader}.
     *
     * Errors can be thrown here.
     *
     * {@see AsyncLoader}
     */
    protected abstract async forceLoadMembers(): Promise<void>;

    @action
    toggleOpen(stratumId: string) {
      this.setTrait(stratumId, "isOpen", !this.isOpen);
    }

    /** "Merges" group members with the same name if `mergeGroupsByName` Trait is set to `true`
     * It does this by:
     * - Creating a new CatalogGroup with all members of each merged group
     * - Appending merged group ids to `excludeMembers`
     * This is only applied to the first level of group members (it is not recursive)
     * `mergeGroupsByName` is not applied to nested groups automatically.
     */
    @action
    mergeGroupMembersByName() {
      if (!this.mergeGroupsByName) return;
      // Create map of group names to group models
      const membersByName = new Map<string, GroupMixin.Instance[]>();
      this.memberModels.forEach((member) => {
        if (
          GroupMixin.isMixedInto(member) &&
          CatalogMemberMixin.isMixedInto(member) &&
          member.name
        ) {
          // Push member to map
          membersByName.get(member.name)?.push(member) ??
            membersByName.set(member.name, [member]);
        }
      });

      membersByName.forEach((groups, name) => {
        if (groups.length > 1) {
          const groupIdsToMerge = groups
            .map((g) => g.uniqueId)
            .filter(isJsonString);

          const mergedGroupId = `${this.uniqueId}/${MERGED_GROUP_ID_PREPEND}${name}`;

          let mergedGroup = this.terria.getModelById(BaseModel, mergedGroupId);

          // Create mergedGroup if it doesn't exist - and then add it to group.members
          if (!mergedGroup) {
            mergedGroup = CatalogMemberFactory.create(
              "group",
              mergedGroupId,
              this.terria
            );

            if (mergedGroup) {
              // We add groupIdsToMerge as shareKeys here for backward compatibility
              this.terria.addModel(mergedGroup, groupIdsToMerge);
              this.add(CommonStrata.override, mergedGroup);
            }
          }

          // Set merged group traits - name and members
          // Also set excludeMembers to exclude all groups that are merged.
          if (
            GroupMixin.isMixedInto(mergedGroup) &&
            CatalogMemberMixin.isMixedInto(mergedGroup)
          ) {
            mergedGroup.setTrait(CommonStrata.definition, "name", name);
            mergedGroup.setTrait(
              CommonStrata.definition,
              "members",
              flatten(groups.map((g) => [...g.members]))
            );
            this.setTrait(
              CommonStrata.override,
              "excludeMembers",
              uniq([...(this.excludeMembers ?? []), ...groupIdsToMerge])
            );
          }
        }
      });
    }

    @action
    refreshKnownContainerUniqueIds(uniqueId: string | undefined): void {
      if (!uniqueId) return;
      this.memberModels.forEach((model: BaseModel) => {
        if (model.knownContainerUniqueIds.indexOf(uniqueId) < 0) {
          model.knownContainerUniqueIds.push(uniqueId);
        }
      });
    }

    @action
    addItemPropertiesToMembers(): void {
      this.memberModels.forEach((model: BaseModel) => {
        applyItemProperties(this, model);
      });
    }

    @action
    addShareKeysToMembers(members = this.memberModels): void {
      const groupId = this.uniqueId;
      if (!groupId) return;

      // Get shareKeys for this Group
      const shareKeys = this.terria.modelIdShareKeysMap.get(groupId);
      if (!shareKeys || shareKeys.length === 0) return;

      /**
       * Go through each shareKey and create new shareKeys for members
       * - Look at current member.uniqueId
       * - Replace instances of group.uniqueID in member.uniqueId with shareKey
       * For example:
       * - group.uniqueId = 'some-group-id'
       * - member.uniqueId = 'some-group-id/some-member-id'
       * - group.shareKeys = 'old-group-id'
       * - So we want to create member.shareKeys = ["old-group-id/some-member-id"]
       *
       * We also repeat this process for each shareKey for each member
       */

      members.forEach((model: BaseModel) => {
        // Only add shareKey if model.uniqueId is an autoID (i.e. contains groupId)
        if (isDefined(model.uniqueId) && model.uniqueId.includes(groupId)) {
          shareKeys.forEach((groupShareKey) => {
            // Get shareKeys for current model
            const modelShareKeys = this.terria.modelIdShareKeysMap.get(
              model.uniqueId!
            );
            modelShareKeys?.forEach((modelShareKey) => {
              this.terria.addShareKey(
                model.uniqueId!,
                modelShareKey.replace(groupId, groupShareKey)
              );
            });
            this.terria.addShareKey(
              model.uniqueId!,
              model.uniqueId!.replace(groupId, groupShareKey)
            );
          });
          // If member is a Group -> apply shareKeys to the next level of members
          if (GroupMixin.isMixedInto(model)) {
            this.addShareKeysToMembers(model.memberModels);
          }
        }
      });
    }

    @action
    add(stratumId: string, member: BaseModel) {
      if (member.uniqueId === undefined) {
        throw new DeveloperError(
          "A model without a `uniqueId` cannot be added to a group."
        );
      }

      const members = this.getTrait(stratumId, "members");
      if (isDefined(members)) {
        members.push(member.uniqueId);
      } else {
        this.setTrait(stratumId, "members", [member.uniqueId]);
      }

      if (
        this.uniqueId !== undefined &&
        member.knownContainerUniqueIds.indexOf(this.uniqueId) < 0
      ) {
        member.knownContainerUniqueIds.push(this.uniqueId);
      }
    }

    @action
    addMembersFromJson(stratumId: string, members: any[]): Result {
      const newMemberIds = this.traits["members"].fromJson(
        this,
        stratumId,
        members
      );
      newMemberIds
        .ignoreError()
        ?.map((memberId: string) =>
          this.terria.getModelById(BaseModel, memberId)
        )
        .forEach((member: BaseModel) => {
          this.add(stratumId, member);
        });

      if (newMemberIds.error)
        return Result.error(
          newMemberIds.error,
          `Failed to add members from JSON for model \`${this.uniqueId}\``
        );

      return Result.none();
    }

    /**
     * Used to re-order catalog members
     *
     * @param stratumId name of the stratum to update
     * @param member the member to be moved
     * @param newIndex the new index to shift the member to
     *
     * @returns true if the member was moved to the new index successfully
     */
    @action
    moveMemberToIndex(stratumId: string, member: BaseModel, newIndex: number) {
      if (member.uniqueId === undefined) {
        throw new DeveloperError(
          "Cannot reorder a model without a `uniqueId`."
        );
      }
      const members = this.members;
      const moveFrom = members.indexOf(member.uniqueId);
      if (members[newIndex] === undefined) {
        throw new DeveloperError(`Invalid 'newIndex' target: ${newIndex}`);
      }
      if (moveFrom === -1) {
        throw new DeveloperError(
          `A model couldn't be found in the group ${this.uniqueId} for member uniqueId ${member.uniqueId}`
        );
      }
      const cloneArr = clone(members);

      // shift a current member to the new index
      cloneArr.splice(newIndex, 0, cloneArr.splice(moveFrom, 1)[0]);
      this.setTrait(stratumId, "members", cloneArr);
      return true;
    }

    @action
    remove(stratumId: string, member: BaseModel) {
      if (member.uniqueId === undefined) {
        return;
      }

      const members = this.getTrait(stratumId, "members");
      if (isDefined(members)) {
        const index = members.indexOf(member.uniqueId);
        if (index !== -1) {
          members.splice(index, 1);
        }
      }
    }

    dispose() {
      super.dispose();
      this._memberLoader.dispose();
    }
  }

  return Klass;
}

namespace GroupMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof GroupMixin>> {}
  export function isMixedInto(model: any): model is Instance {
    return (
      model &&
      "isGroup" in model &&
      model.isGroup &&
      "forceLoadMembers" in model &&
      typeof model.forceLoadMembers === "function"
    );
  }
}

export default GroupMixin;

function getSortProperty(model: BaseModel, prop: string) {
  return (CatalogMemberMixin.isMixedInto(model) &&
    hasTraits(model, model.TraitsClass, prop as any)) ||
    (GroupMixin.isMixedInto(model) &&
      hasTraits(model, model.TraitsClass, prop as any)) ||
    (ReferenceMixin.isMixedInto(model) &&
      hasTraits(model, model.TraitsClass, prop as any))
    ? model[prop!]
    : undefined;
}

function setItemPropertyTraits(
  model: BaseModel,
  itemProperties: JsonObject | undefined
) {
  if (!itemProperties) return;
  Object.keys(itemProperties).map((k: any) =>
    model.setTrait(CommonStrata.override, k, itemProperties[k])
  );
}

/** Applies itemProperties object to a model - this will set traits in override stratum.
 * Also copy ItemPropertiesTraits to target if it supports them
 */

export function applyItemProperties(
  model: HasTrait<ItemPropertiesTraits, "itemProperties"> &
    HasTrait<ItemPropertiesTraits, "itemPropertiesByType"> &
    HasTrait<ItemPropertiesTraits, "itemPropertiesByIds"> &
    BaseModel,
  target: BaseModel
) {
  runInAction(() => {
    if (!target.uniqueId) return;

    // Apply itemProperties to non GroupMixin targets
    if (!GroupMixin.isMixedInto(target))
      setItemPropertyTraits(target, model.itemProperties);

    // Apply itemPropertiesByType
    setItemPropertyTraits(
      target,
      model.itemPropertiesByType.find(
        (itemProps) => itemProps.type && itemProps.type === target.type
      )?.itemProperties
    );

    // Apply itemPropertiesByIds
    model.itemPropertiesByIds.forEach((itemPropsById) => {
      if (itemPropsById.ids.includes(target.uniqueId!)) {
        setItemPropertyTraits(target, itemPropsById.itemProperties);
      }
    });

    // Copy over ItemPropertiesTraits from model, if target has them
    // For example GroupMixin and ReferenceMixin
    if (hasTraits(target, ItemPropertiesTraits, "itemProperties"))
      target.setTrait(
        CommonStrata.underride,
        "itemProperties",
        model.traits.itemProperties.toJson(model.itemProperties)
      );

    if (hasTraits(target, ItemPropertiesTraits, "itemPropertiesByType"))
      target.setTrait(
        CommonStrata.underride,
        "itemPropertiesByType",
        model.traits.itemPropertiesByType.toJson(model.itemPropertiesByType)
      );

    if (hasTraits(target, ItemPropertiesTraits, "itemPropertiesByIds"))
      target.setTrait(
        CommonStrata.underride,
        "itemPropertiesByIds",
        model.traits.itemPropertiesByIds.toJson(model.itemPropertiesByIds)
      );
  });
}
