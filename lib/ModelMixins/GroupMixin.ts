import { action, computed, observable, runInAction } from "mobx";
import Constructor from "../Core/Constructor";
import filterOutUndefined from "../Core/filterOutUndefined";
import Model, { BaseModel } from "../Models/Model";
import GroupTraits from "../Traits/GroupTraits";
import CommonStrata from "../Models/CommonStrata";
import isDefined from "../Core/isDefined";

function GroupMixin<T extends Constructor<Model<GroupTraits>>>(Base: T) {
  abstract class GroupMixin extends Base {
    get isGroup() {
      return true;
    }

    /**
     * Gets a value indicating whether metadata is currently loading.
     */
    get isLoadingMembers(): boolean {
      return this._isLoadingMembers;
    }

    @observable
    private _isLoadingMembers = false;

    private _membersPromise: Promise<void> | undefined = undefined;

    @computed
    get memberModels(): ReadonlyArray<BaseModel> {
      const members = this.members;
      if (members === undefined) {
        return [];
      }
      return filterOutUndefined(
        members.map(id => this.terria.getModelById(BaseModel, id))
      );
    }

    @action
    toggleOpen(stratumId: string) {
      this.setTrait(stratumId, "isOpen", !this.isOpen);
    }

    loadMembers(): Promise<void> {
      const newPromise = this.loadMembersKeepAlive;
      if (newPromise !== this._membersPromise) {
        this._membersPromise = newPromise;

        runInAction(() => {
          this._isLoadingMembers = true;
        });
        newPromise
          .then(result => {
            runInAction(() => {
              this._isLoadingMembers = false;
            });
            return result;
          })
          .catch(e => {
            runInAction(() => {
              this._isLoadingMembers = false;
            });
            throw e;
          });
      }

      return newPromise;
    }

    protected abstract get loadMembersPromise(): Promise<void>;

    @computed({ keepAlive: true })
    private get loadMembersKeepAlive(): Promise<void> {
      return this.loadMembersPromise;
    }

    @action add(stratumId: string, member: BaseModel) {
      const members = this.getTrait(stratumId, "members");
      if (isDefined(members)) {
        members.push(member.id);
      } else {
        this.setTrait(stratumId, "members", [member.id]);
      }
    }

    @action remove(stratumId: string, member: BaseModel) {
      const members = this.getTrait(stratumId, "members");
      if (isDefined(members)) {
        const index = members.indexOf(member.id);
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
