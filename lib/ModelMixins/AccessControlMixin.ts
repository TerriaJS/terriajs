import { action, computed, observable, makeObservable } from "mobx";
import AbstractConstructor from "../Core/AbstractConstructor";
import Model, { BaseModel } from "../Models/Definition/Model";
import ModelTraits from "../Traits/ModelTraits";

type BaseType = Model<ModelTraits>;

/**
 * API for setting an access type for the model. Note that the intended use of
 * this mixin is just to flag public and private models differently in the UI
 * and does not provide any security guarantees.
 *
 * The implementation is a bit fluid and maybe that makes it a bit hard to
 * reason about because we are not strongly typing the possible values for
 * `accessType`. For use in frontend, we formally recognizes only one acessType
 * which is "public". All other access type values are treated as "private". The
 * models overriding this mixin are free to choose any other string valued
 * access type for their own purpose.
 */
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
     * Resolve accessType for this model in the following order:
     *  1. Return the access type that was set on this model by explicitly calling setAccessType()
     *  2. If this model is referenced by another, return the access type of the referrer
     *  3. Return the access type of a parent with valid access type
     *  4. If none of the above works - return "public"
     */
    @computed
    get accessType(): string {
      // Return the explicitly set accessType
      if (this._accessType) {
        return this._accessType;
      }

      // Return the accessType of the referrer.
      if (AccessControlMixin.isMixedInto(this.sourceReference)) {
        return this.sourceReference.accessType;
      }

      // Try and return any ancestor's accessType
      if (this.knownContainerUniqueIds.length > 0) {
        const parentId = this.knownContainerUniqueIds[0];
        const parent =
          parentId && this.terria.getModelById(BaseModel, parentId);
        if (AccessControlMixin.isMixedInto(parent)) {
          return parent.accessType;
        }
      }

      // Default
      return "public";
    }

    @action
    setAccessType(accessType: string) {
      this._accessType = accessType;
    }

    /**
     * Returns true if this model public.
     */
    @computed
    get isPublic() {
      return this.accessType === "public";
    }

    /**
     * Returns true if this model is private.
     *
     * Note that any accessType other than "public" is treated as private.
     */
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
