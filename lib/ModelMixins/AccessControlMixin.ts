import { action, computed, observable, makeObservable } from "mobx";
import AbstractConstructor from "../Core/AbstractConstructor";
import Model, { BaseModel } from "../Models/Definition/Model";
import ModelTraits from "../Traits/ModelTraits";

type BaseType = Model<ModelTraits>;

function AccessControlMixin<T extends AbstractConstructor<BaseType>>(Base: T) {
  abstract class _AccessControlMixin extends Base {
    @observable private _accessType: string | undefined;

    constructor(...args: any[]) {
      super(...args);
      makeObservable(this);
    }

    get hasAccessControlMixin() {
      return true;
    }

    /**
     * Returns the accessType for this model, default is public
     * Models can override this method to return access type differently
     */
    @computed
    get accessType(): string {
      if (this._accessType) return this._accessType;

      if (AccessControlMixin.isMixedInto(this.sourceReference)) {
        // This item is the target of a reference item, return the accessType
        // of the reference item.
        return this.sourceReference.accessType;
      }

      // Try and return the parents accessType
      if (this.knownContainerUniqueIds.length > 0) {
        const parentId = this.knownContainerUniqueIds[0];
        const parent =
          parentId && this.terria.getModelById(BaseModel, parentId);
        if (AccessControlMixin.isMixedInto(parent)) {
          return parent.accessType;
        }
      }

      // default
      return "public";
    }

    /* TODO: check if we actually need provision to explcitly set accessType */
    @action
    setAccessType(accessType: string) {
      this._accessType = accessType;
    }

    @computed
    get isPublic() {
      return this.accessType === "public";
    }

    @computed
    get isPrivate() {
      return this.accessType !== "public";
    }
  }

  return _AccessControlMixin;
}

namespace AccessControlMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof AccessControlMixin>> {}

  export function isMixedInto(model: any): model is Instance {
    return model && model.hasAccessControlMixin;
  }
}

export default AccessControlMixin;
