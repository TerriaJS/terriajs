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

type MixinModel = Model<
  DiffableTraits & ShowableTraits & CatalogMemberTraits & SplitterTraits
> &
  TimeFilterMixin.Instance;

function DiffableMixin<T extends Constructor<MixinModel>>(Base: T) {
  abstract class DiffableMixin extends Base {
    abstract styleSelector: SelectableStyle | undefined;

    /**
     * A list of styles on which we can run the difference computation
     */
    abstract availableDiffStyles: readonly AvailableStyle[] | undefined;

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
    get discreteTimesAsSortedJulianDates() {
      // Hides date time selectors for the item if it is currently showing difference image
      return this.isShowingDiff
        ? undefined
        : super.discreteTimesAsSortedJulianDates;
    }

    @computed
    get canFilterTimeByFeature() {
      // Hides the SatelliteImageryTimeFilterSection for the item if it is
      // currently showing difference image
      return this.isShowingDiff ? false : true;
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
}

export default DiffableMixin;
