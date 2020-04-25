import DiffableTraits from "../Traits/DiffableTraits";
import Model from "../Models/Model";
import Constructor from "../Core/Constructor";
import { JulianDate } from "cesium";

type MixinModel = Model<DiffableTraits>;

function DiffableMixin<T extends Constructor<MixinModel>>(Base: T) {
  abstract class DiffableMixin extends Base {
    get hasDiffableMixin() {
      return true;
    }

    abstract showDiffImage(
      firstDate: JulianDate,
      secondDate: JulianDate,
      diffStyleId: string
    ): void;
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
