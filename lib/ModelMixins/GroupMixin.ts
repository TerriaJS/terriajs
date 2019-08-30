import { action, computed, observable, runInAction } from "mobx";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import Constructor from "../Core/Constructor";
import filterOutUndefined from "../Core/filterOutUndefined";
import isDefined from "../Core/isDefined";
import Model, { BaseModel } from "../Models/Model";
import GroupTraits from "../Traits/GroupTraits";
import ModelReference from "../Traits/ModelReference";
import AsyncLoader from "../Core/AsyncLoader";
import { unique } from "mobx/lib/internal";

function GroupMixin<T extends Constructor<Model<GroupTraits>>>(Base: T) {
  abstract class GroupMixin extends Base {
    private _memberLoader = new AsyncLoader(this.forceLoadMembers.bind(this));

    /**
     * Forces load of the group members. This method does _not_ need to consider
     * whether the group members are already loaded. When the promise returned
     * by this function resolves, the list of members in `GroupMixin#members`
     * and `GroupMixin#memberModels` should be complete, but the individual
     * members will not necessarily be loaded themselves.
     */
    protected abstract forceLoadMembers(): Promise<void>;

    get isGroup() {
      return true;
    }

    /**
     * Gets a value indicating whether the set of members is currently loading.
     */
    get isLoadingMembers(): boolean {
      return this._memberLoader.isLoading;
    }

    @computed
    get memberModels(): ReadonlyArray<BaseModel> {
      const members = this.members;
      if (members === undefined) {
        return [];
      }
      return filterOutUndefined(
        members.map(id =>
          ModelReference.isRemoved(id)
            ? undefined
            : this.terria.getModelById(BaseModel, id)
        )
      );
    }

    @action
    toggleOpen(stratumId: string) {
      this.setTrait(stratumId, "isOpen", !this.isOpen);
    }

    /**
     * Load the group members if necessary. Returns an existing promise
     * if the members are already loaded or if loading is already in progress,
     * so it is safe and performant to call this function as often as
     * necessary. When the promise returned by this function resolves, the
     * list of members in `GroupMixin#members` and `GroupMixin#memberModels`
     * should be complete, but the individual members will not necessarily be
     * loaded themselves.
     */
    loadMembers(): Promise<void> {
      return this._memberLoader.load().finally(() => {
        if (this.uniqueId) {
          this.refreshKnownContainerUniqueIds(this.uniqueId);
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
    }

    @action
    moveMemberToIndex(stratumId: string, member: BaseModel, newIndex: number) {
      if (member.uniqueId === undefined) {
        return;
      }
      const members = this.getTrait(stratumId, "members");

      if (isDefined(members)) {
        const moveFrom = members.indexOf(member.uniqueId);
        if (moveFrom === -1) {
          return;
        }
        // shift a current member to the new index
        members.splice(newIndex, 0, members.splice(moveFrom, 1)[0]);
      }
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
  }

  return GroupMixin;
}

namespace GroupMixin {
  export interface GroupMixin
    extends InstanceType<ReturnType<typeof GroupMixin>> {}
  export function isMixedInto(model: any): model is GroupMixin {
    return model && model.isGroup;
  }
}

export default GroupMixin;
