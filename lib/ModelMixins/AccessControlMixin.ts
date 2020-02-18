import { action, computed, observable } from "mobx";
import Constructor from "../Core/Constructor";
import Model from "../Models/Model";
import ModelTraits from "../Traits/ModelTraits";
import getAncestors from "../Models/getAncestors";

type AccessControlModel = Model<ModelTraits>;

export type AccessType = "public" | "private" | "shared";

export function isValidAccessType(type: string) {
  return type === "public" || type === "private" || type === "shared";
}

function AccessControlMixin<T extends Constructor<AccessControlModel>>(
  Base: T
) {
  class Klass extends Base {
    @observable private _accessType: AccessType | undefined;

    get hasAccessControlMixin() {
      return true;
    }

    /**
     * Returns the accessType for this model, default is public
     *
     * Models can override this method to return access type differently
     */
    @computed
    get accessType(): AccessType {
      if (AccessControlMixin.isMixedInto(this.sourceReference)) {
        return this.sourceReference.accessType;
      }
      if (this._accessType) {
        return this._accessType;
      }
      const parent = getAncestors(this.terria, this)[0];
      if (AccessControlMixin.isMixedInto(parent)) {
        return parent.accessType;
      }
      return "public";
    }

    @action
    setAccessType(accessType: AccessType) {
      this._accessType = accessType;
    }

    @computed
    get isPublic() {
      return this.accessType === "public";
    }

    @computed
    get isPrivate() {
      return this.accessType === "private" || this.accessType === "shared";
    }
  }

  return Klass;
}

namespace AccessControlMixin {
  export interface AccessControlMixin
    extends InstanceType<ReturnType<typeof AccessControlMixin>> {}

  export function isMixedInto(model: any): model is AccessControlMixin {
    return model && model.hasAccessControlMixin;
  }
}

export default AccessControlMixin;
