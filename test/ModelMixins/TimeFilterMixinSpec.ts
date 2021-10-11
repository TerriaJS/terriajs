import { action, computed, makeObservable } from "mobx";
import TimeFilterMixin from "../../lib/ModelMixins/TimeFilterMixin";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import CreateModel from "../../lib/Models/Definition/CreateModel";
import Terria from "../../lib/Models/Terria";
import DiscretelyTimeVaryingTraits from "../../lib/Traits/TraitsClasses/DiscretelyTimeVaryingTraits";
import MappableTraits from "../../lib/Traits/TraitsClasses/MappableTraits";
import mixTraits from "../../lib/Traits/mixTraits";
import TimeFilterTraits from "../../lib/Traits/TraitsClasses/TimeFilterTraits";
import { BaseModel } from "../../lib/Models/Definition/Model";
import ModelTraits from "../../lib/Traits/ModelTraits";

describe("TimeFilterMixin", function() {
  describe("canFilterTimeByFeature", function() {
    it(
      "returns false if timeFilterPropertyName is not set",
      action(function() {
        const testItem = new TestTimeFilterableItem("test", new Terria());
        expect(testItem.canFilterTimeByFeature).toBe(false);
      })
    );

    it(
      "returns true if timeFilterPropertyName is set",
      action(function() {
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
  CreateModel(
    mixTraits(TimeFilterTraits, DiscretelyTimeVaryingTraits, MappableTraits)
  )
) {
  constructor(
    id: string | undefined,
    terria: Terria,
    sourceReference?: BaseModel | undefined,
    strata?: Map<string, ModelTraits> | undefined
  ) {
    super(id, terria, sourceReference, strata);

    makeObservable(this);
  }

  forceLoadMapItems() {
    return Promise.resolve();
  }

  get discreteTimes() {
    return undefined;
  }

  @computed
  get mapItems() {
    return [];
  }
}
