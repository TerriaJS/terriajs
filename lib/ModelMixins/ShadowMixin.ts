import { computed, runInAction } from "mobx";
import ShadowMode from "terriajs-cesium/Source/Scene/ShadowMode";
import Constructor from "../Core/Constructor";
import Model from "../Models/Model";
import { SelectableDimension } from "../Models/SelectableDimensions";
import ShadowTraits, { Shadows } from "../Traits/TraitsClasses/ShadowTraits";

function ShadowMixin<T extends Constructor<Model<ShadowTraits>>>(Base: T) {
  abstract class ShadowMixin extends Base {
    get hasShadows() {
      return true;
    }

    @computed get cesiumShadows() {
      switch (this.shadows.toLowerCase()) {
        case "none":
          return ShadowMode.DISABLED;
        case "both":
          return ShadowMode.ENABLED;
        case "cast":
          return ShadowMode.CAST_ONLY;
        case "receive":
          return ShadowMode.RECEIVE_ONLY;
        default:
          return ShadowMode.DISABLED;
      }
    }

    /** Shadow SelectableDimension. This has to be added to a catalog member's `selectableDimension` array */
    @computed
    get shadowDimension(): SelectableDimension {
      return {
        id: "shadows",
        name: "Shadows",
        options: [
          { id: "NONE", name: "None" },
          { id: "CAST", name: "Cast Only" },
          { id: "RECEIVE", name: "Receive Only" },
          { id: "BOTH", name: "Cast and Receive" }
        ],
        selectedId: this.shadows,
        disable: !this.showShadowUi,
        setDimensionValue: (strata: string, shadow: Shadows) =>
          runInAction(() => this.setTrait(strata, "shadows", shadow))
      };
    }
  }

  return ShadowMixin;
}

namespace ShadowMixin {
  export interface ShadowsMixin
    extends InstanceType<ReturnType<typeof ShadowMixin>> {}
  export function isMixedInto(model: any): model is ShadowsMixin {
    return model && model.hasShadows;
  }
}

export default ShadowMixin;
