import { computed } from "mobx";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import Constructor from "../Core/Constructor";
import Model from "../Models/Definition/Model";
import { SelectableDimension } from "../Models/SelectableDimensions";
import StratumOrder from "../Models/Definition/StratumOrder";
import CatalogMemberTraits from "../Traits/TraitsClasses/CatalogMemberTraits";
import DiffableTraits from "../Traits/TraitsClasses/DiffableTraits";
import MappableTraits from "../Traits/TraitsClasses/MappableTraits";
import SplitterTraits from "../Traits/TraitsClasses/SplitterTraits";
import TimeFilterMixin from "./TimeFilterMixin";

type MixinModel = Model<
  DiffableTraits & MappableTraits & CatalogMemberTraits & SplitterTraits
> &
  TimeFilterMixin.Instance;

function DiffableMixin<T extends Constructor<MixinModel>>(Base: T) {
  abstract class DiffableMixin extends Base {
    abstract get styleSelectableDimensions(): SelectableDimension[] | undefined;

    get hasDiffableMixin() {
      return true;
    }

    abstract get canDiffImages(): boolean;

    abstract showDiffImage(
      firstDate: JulianDate,
      secondDate: JulianDate,
      diffStyleId: string
    ): void;

    abstract clearDiffImage(): void;

    abstract getLegendUrlForStyle(
      diffStyleId: string,
      firstDate?: JulianDate,
      secondDate?: JulianDate
    ): string;

    @computed
    get canFilterTimeByFeature() {
      // Hides the SatelliteImageryTimeFilterSection for the item if it is
      // currently showing difference image
      return super.canFilterTimeByFeature && !this.isShowingDiff;
    }
  }

  return DiffableMixin;
}

namespace DiffableMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof DiffableMixin>> {}

  export function isMixedInto(model: any): model is Instance {
    return model?.hasDiffableMixin;
  }

  export const diffStratumName = "diffStratum";
  StratumOrder.addLoadStratum(diffStratumName);
}

export default DiffableMixin;
