import { action, computed } from "mobx";
import clone from "terriajs-cesium/Source/Core/clone";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import AsyncLoader from "../Core/AsyncLoader";
import Constructor from "../Core/Constructor";
import filterOutUndefined from "../Core/filterOutUndefined";
import isDefined from "../Core/isDefined";
import { isJsonNumber, isJsonString } from "../Core/Json";
import Result from "../Core/Result";
import Group from "../Models/Catalog/Group";
import hasTraits from "../Models/Definition/hasTraits";
import Model, { BaseModel } from "../Models/Definition/Model";
import ModelReference from "../Traits/ModelReference";
import GroupTraits from "../Traits/TraitsClasses/GroupTraits";
import CatalogMemberMixin, { getName } from "./CatalogMemberMixin";

const naturalSort = require("javascript-natural-sort");
naturalSort.insensitive = true;

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

      this.knownContainerUniqueIds.forEach(containerId => {
        const container = this.terria.getModelById(BaseModel, containerId);
        if (container && GroupMixin.isMixedInto(container)) {
          container.mergedExcludeMembers.forEach(s => blacklistSet.add(s));
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
        members.map(id => {
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
                name =>
                  model.uniqueId?.toLowerCase().trim() ===
                  name.toLowerCase().trim()
              ) &&
              // Does excludeMembers not include model name
              (!modelName ||
                !this.mergedExcludeMembers.find(
                  name =>
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
          const aValue =
            CatalogMemberMixin.isMixedInto(a) &&
            hasTraits(a, a.TraitsClass, this.sortMembersBy as any)
              ? a[this.sortMembersBy!]
              : Infinity;
          const bValue =
            CatalogMemberMixin.isMixedInto(b) &&
            hasTraits(b, b.TraitsClass, this.sortMembersBy as any)
              ? b[this.sortMembersBy!]
              : Infinity;
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

        this.refreshKnownContainerUniqueIds(this.uniqueId);
        this.addShareKeysToMembers();
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
          shareKeys.forEach(groupShareKey => {
            // Get shareKeys for current model
            const modelShareKeys = this.terria.modelIdShareKeysMap.get(
              model.uniqueId!
            );
            modelShareKeys?.forEach(modelShareKey => {
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
