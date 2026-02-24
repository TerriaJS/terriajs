import { render } from "@testing-library/react";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import WorkflowPanel from "../../../lib/ReactViews/Workflow/WorkflowPanel";

describe("WorkflowPanel", function () {
  let terria: Terria;
  let viewState: ViewState;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    terria.configParameters.regionMappingDefinitionsUrl =
      "./data/regionMapping.json";
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined
    });
  });

  it("sets isWorkflowPanelActive when opened", function () {
    expect(viewState.terria.isWorkflowPanelActive).toBe(false);
    render(
      <WorkflowPanel
        viewState={viewState}
        title="test"
        icon={{ id: "test-icon" }}
        closeButtonText="close"
        onClose={() => {}}
      >
        children
      </WorkflowPanel>
    );
    expect(viewState.terria.isWorkflowPanelActive).toBe(true);
  });

  it("unsets isWorkflowPanelActive sidepanel when closed", async function () {
    const { unmount } = render(
      <WorkflowPanel
        viewState={viewState}
        title="test"
        icon={{ id: "test-icon" }}
        closeButtonText="close"
        onClose={() => {}}
      >
        test
      </WorkflowPanel>
    );
    expect(viewState.terria.isWorkflowPanelActive).toBe(true);
    unmount();
    // Wait for the unmount to complete, this will be properly fixed as part of testing environment improvement
    setTimeout(() => {
      expect(viewState.terria.isWorkflowPanelActive).toBe(false);
    }, 0);
  });
});
