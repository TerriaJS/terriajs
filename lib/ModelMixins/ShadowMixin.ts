import i18next from "i18next";
import { computed, makeObservable, runInAction } from "mobx";
import ShadowMode from "terriajs-cesium/Source/Scene/ShadowMode";
import AbstractConstructor from "../Core/AbstractConstructor";
import Model from "../Models/Definition/Model";
import { SelectableDimension } from "../Models/SelectableDimensions/SelectableDimensions";
import ShadowTraits from "../Traits/TraitsClasses/ShadowTraits";

type BaseType = Model<ShadowTraits>;

function ShadowMixin<T extends AbstractConstructor<BaseType>>(Base: T) {
  abstract class ShadowMixin extends Base {
    constructor(...args: any[]) {
      super(...args);
      makeObservable(this);
    }

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
    get shadowDimensions(): SelectableDimension[] {
      return [
        {
          id: "shadows",
          name: i18next.t("models.shadow.name"),
          options: [
            { id: "NONE", name: i18next.t("models.shadow.options.none") },
            { id: "CAST", name: i18next.t("models.shadow.options.cast") },
            { id: "RECEIVE", name: i18next.t("models.shadow.options.receive") },
            { id: "BOTH", name: i18next.t("models.shadow.options.both") }
          ],
          selectedId: this.shadows,
          disable: !this.showShadowUi,
          setDimensionValue: (strata: string, shadow: string | undefined) =>
            shadow === "CAST" ||
            shadow === "RECEIVE" ||
            shadow === "BOTH" ||
            shadow === "NONE"
              ? runInAction(() => this.setTrait(strata, "shadows", shadow))
              : null
        }
      ];
    }
  }

  return ShadowMixin;
}

namespace ShadowMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof ShadowMixin>> {}
  export function isMixedInto(model: any): model is Instance {
    return model && model.hasShadows;
  }
}

export default ShadowMixin;
