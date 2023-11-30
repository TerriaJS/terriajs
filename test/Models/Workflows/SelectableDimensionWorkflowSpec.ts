import SelectableDimensionWorkflow, {
  runWorkflow
} from "../../../lib/Models/Workflows/SelectableDimensionWorkflow";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import Terria from "../../../lib/Models/Terria";
import Icon from "../../../lib/Styled/Icon";
import SimpleCatalogItem from "../../Helpers/SimpleCatalogItem";

describe("SelectableDimensionWorkflow", function () {
  let viewState: ViewState;
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria();
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined
    });
  });

  it("can run a workflow", function () {
    const item = new SimpleCatalogItem("simple", terria);
    const setSizeWorkflow: SelectableDimensionWorkflow = {
      name: "Workflow name",
      icon: Icon.GLYPHS.cube,
      item,
      selectableDimensions: [
        {
          type: "group",
          name: "Cube size",
          selectableDimensions: [
            {
              type: "numeric",
              name: "Size (meters)",
              setDimensionValue: () => {}
            }
          ]
        }
      ]
    };
    expect(terria.selectableDimensionWorkflow).toBeUndefined();
    runWorkflow(viewState, setSizeWorkflow);
    expect(terria.selectableDimensionWorkflow?.name).toBe(setSizeWorkflow.name);
  });
});
