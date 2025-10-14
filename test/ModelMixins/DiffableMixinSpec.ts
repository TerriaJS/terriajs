import { action, computed, makeObservable } from "mobx";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import DiffableMixin from "../../lib/ModelMixins/DiffableMixin";
import MappableMixin from "../../lib/ModelMixins/MappableMixin";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import CreateModel from "../../lib/Models/Definition/CreateModel";
import { ModelConstructorParameters } from "../../lib/Models/Definition/Model";
import Terria from "../../lib/Models/Terria";
import mixTraits from "../../lib/Traits/mixTraits";
import CatalogMemberTraits from "../../lib/Traits/TraitsClasses/CatalogMemberTraits";
import DiffableTraits from "../../lib/Traits/TraitsClasses/DiffableTraits";
import SplitterTraits from "../../lib/Traits/TraitsClasses/SplitterTraits";

describe("DiffableMixin", function () {
  describe("canFilterTimeByFeature", function () {
    it(
      "returns false if the item is showing diff",
      action(function () {
        const testItem = new TestDiffableItem("test", new Terria());
        testItem.setTrait(CommonStrata.user, "isShowingDiff", true);
        expect(testItem.canFilterTimeByFeature).toBe(false);
      })
    );

    it(
      "otherwise returns the inherited value",
      action(function () {
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
  MappableMixin(
    CreateModel(mixTraits(DiffableTraits, CatalogMemberTraits, SplitterTraits))
  )
) {
  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  protected async forceLoadMapItems() {}
  styleSelectableDimensions = [];

  get canDiffImages() {
    return true;
  }

  showDiffImage(
    _firstDate: JulianDate,
    _secondDate: JulianDate,
    _diffStyleId: string
  ) {}

  clearDiffImage() {}

  getLegendUrlForStyle(
    _diffStyleId: string,
    _firstDate: JulianDate,
    _secondDate: JulianDate
  ) {
    return "test-legend-url";
  }

  @computed
  get mapItems() {
    return [];
  }
}
