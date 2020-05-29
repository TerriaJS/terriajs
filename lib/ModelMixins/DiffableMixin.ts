import { JulianDate } from "cesium";
import { computed } from "mobx";
import Constructor from "../Core/Constructor";
import Model from "../Models/Model";
import SelectableStyle, { AvailableStyle } from "../Models/SelectableStyle";
import CatalogMemberTraits from "../Traits/CatalogMemberTraits";
import DiffableTraits from "../Traits/DiffableTraits";
import ShowableTraits from "../Traits/ShowableTraits";
import SplitterTraits from "../Traits/SplitterTraits";
import TimeFilterMixin from "./TimeFilterMixin";
import StratumOrder from "../Models/StratumOrder";

type MixinModel = Model<
  DiffableTraits & ShowableTraits & CatalogMemberTraits & SplitterTraits
> &
  TimeFilterMixin.Instance;

function DiffableMixin<T extends Constructor<MixinModel>>(Base: T) {
  abstract class DiffableMixin extends Base {
    abstract get styleSelector(): SelectableStyle | undefined;

    get hasDiffableMixin() {
      return true;
    }

    abstract showDiffImage(
      firstDate: JulianDate,
      secondDate: JulianDate,
      diffStyleId: string
    ): void;

    abstract clearDiffImage(): void;

    abstract getLegendUrlForDiffStyle(
      diffStyleId: string,
      firstDate: JulianDate,
      secondDate: JulianDate
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
