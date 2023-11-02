import { action, computed } from "mobx";
import TimeFilterMixin from "../../lib/ModelMixins/TimeFilterMixin";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import CreateModel from "../../lib/Models/Definition/CreateModel";
import Terria from "../../lib/Models/Terria";
import DiscretelyTimeVaryingTraits from "../../lib/Traits/TraitsClasses/DiscretelyTimeVaryingTraits";
import MappableTraits from "../../lib/Traits/TraitsClasses/MappableTraits";
import mixTraits from "../../lib/Traits/mixTraits";
import TimeFilterTraits from "../../lib/Traits/TraitsClasses/TimeFilterTraits";

describe("TimeFilterMixin", function () {
  describe("canFilterTimeByFeature", function () {
    it(
      "returns false if timeFilterPropertyName is not set",
      action(function () {
        const testItem = new TestTimeFilterableItem("test", new Terria());
        expect(testItem.canFilterTimeByFeature).toBe(false);
      })
    );

    it(
      "returns true if timeFilterPropertyName is set",
      action(function () {
        const testItem = new TestTimeFilterableItem("test", new Terria());
        testItem.setTrait(
          CommonStrata.user,
          "timeFilterPropertyName",
          "filter-dates"
        );
        expect(testItem.canFilterTimeByFeature).toBe(true);
      })
    );
  });
});

class TestTimeFilterableItem extends TimeFilterMixin(
  CreateModel(mixTraits(TimeFilterTraits))
) {
  protected async forceLoadMapItems(): Promise<void> {}
  get discreteTimes() {
    return undefined;
  }

  @computed
  get mapItems() {
    return [];
  }
}
