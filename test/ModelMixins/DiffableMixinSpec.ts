import { action, computed } from "mobx";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import DiffableMixin from "../../lib/ModelMixins/DiffableMixin";
import TimeFilterMixin from "../../lib/ModelMixins/TimeFilterMixin";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import CreateModel from "../../lib/Models/Definition/CreateModel";
import { SelectableDimensionSelect } from "../../lib/Models/SelectableDimensions";
import Terria from "../../lib/Models/Terria";
import mixTraits from "../../lib/Traits/mixTraits";
import CatalogMemberTraits from "../../lib/Traits/TraitsClasses/CatalogMemberTraits";
import DiffableTraits from "../../lib/Traits/TraitsClasses/DiffableTraits";
import DiscretelyTimeVaryingTraits from "../../lib/Traits/TraitsClasses/DiscretelyTimeVaryingTraits";
import MappableTraits from "../../lib/Traits/TraitsClasses/MappableTraits";
import SplitterTraits from "../../lib/Traits/TraitsClasses/SplitterTraits";
import TimeFilterTraits from "../../lib/Traits/TraitsClasses/TimeFilterTraits";

describe("DiffableMixin", function() {
  describe("canFilterTimeByFeature", function() {
    it(
      "returns false if the item is showing diff",
      action(function() {
        const testItem = new TestDiffableItem("test", new Terria());
        testItem.setTrait(CommonStrata.user, "isShowingDiff", true);
        expect(testItem.canFilterTimeByFeature).toBe(false);
      })
    );

    it(
      "otherwise returns the inherited value",
      action(function() {
        const testItem = new TestDiffableItem("test", new Terria());
        testItem.setTrait(CommonStrata.user, "isShowingDiff", false);
        testItem.setTrait(CommonStrata.user, "timeFilterPropertyName", "foo");
        expect(testItem.canFilterTimeByFeature).toBe(true);
        testItem.setTrait(
          CommonStrata.user,
          "timeFilterPropertyName",
          undefined
        );
        expect(testItem.canFilterTimeByFeature).toBe(false);
      })
    );
  });
});

class TestDiffableItem extends DiffableMixin(
  TimeFilterMixin(
    CreateModel(
      mixTraits(
        DiffableTraits,
        CatalogMemberTraits,
        SplitterTraits,
        TimeFilterTraits,
        DiscretelyTimeVaryingTraits,
        MappableTraits
      )
    )
  )
) {
  styleSelectableDimensions:
    | SelectableDimensionSelect[]
    | undefined = undefined;

  get canDiffImages() {
    return true;
  }

  get discreteTimes() {
    return undefined;
  }

  showDiffImage(
    firstDate: JulianDate,
    secondDate: JulianDate,
    diffStyleId: string
  ) {}

  clearDiffImage() {}

  getLegendUrlForStyle(
    diffStyleId: string,
    firstDate: JulianDate,
    secondDate: JulianDate
  ) {
    return "test-legend-url";
  }

  @computed
  get mapItems() {
    return [];
  }
}
