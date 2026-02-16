import { render, screen } from "@testing-library/react";
import FilterSection from "../../../../lib/ReactViews/Workbench/Controls/FilterSection";
import Terria from "../../../../lib/Models/Terria";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import CreateModel from "../../../../lib/Models/Definition/CreateModel";
import { FilterTraits } from "../../../../lib/Traits/TraitsClasses/Cesium3dTilesTraits";
import objectArrayTrait from "../../../../lib/Traits/Decorators/objectArrayTrait";
import ModelTraits from "../../../../lib/Traits/ModelTraits";
import { runInAction } from "mobx";

class TestTraits extends ModelTraits {
  @objectArrayTrait({
    type: FilterTraits,
    idProperty: "name",
    name: "filters",
    description: "The filters to apply to this catalog item."
  })
  filters?: FilterTraits[];
}

class TestModel extends CreateModel(TestTraits) {}

describe("FilterSectionSpec", function () {
  let terria: Terria;
  let item: TestModel;

  beforeAll(() => {
    terria = new Terria({
      baseUrl: "./"
    });
    item = new TestModel("test", terria);
  });

  it("Renders nothing if no filters", function () {
    const { container } = render(<FilterSection item={item} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("Renders a range input for each filter", function () {
    runInAction(() => {
      const filter = item.addObject(
        CommonStrata.user,
        "filters",
        "level-filter"
      );
      filter?.setTrait(CommonStrata.user, "property", "level");
      filter?.setTrait(CommonStrata.user, "minimumValue", 0);
      filter?.setTrait(CommonStrata.user, "maximumValue", 42);
      filter?.setTrait(CommonStrata.user, "minimumShown", 10);
      filter?.setTrait(CommonStrata.user, "maximumShown", 20);
    });

    render(<FilterSection item={item} />);
    expect(screen.getByText("Show level-filter: 10 to 20")).toBeVisible();
    expect(screen.getAllByRole("slider")).toBeDefined();
    expect(screen.getAllByRole("slider").length).toBe(2);
  });
});
