import React from "react";
import TestRenderer, { act, ReactTestRenderer } from "react-test-renderer";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
import WorkflowPanel from "../../lib/Styled/WorkflowPanel";

describe("WorkflowPanel", function() {
  let terria: Terria;
  let viewState: ViewState;
  let testRenderer: ReactTestRenderer;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    terria.configParameters.regionMappingDefinitionsUrl =
      "./data/regionMapping.json";
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined,
      locationSearchProviders: []
    });
  });

  it("hides the terria sidepanel when opened", async function() {
    expect(viewState.showTerriaSidePanel).toBe(true);
    await act(() => {
      TestRenderer.create(
        <WorkflowPanel
          viewState={viewState}
          title="test"
          icon={{ id: "test-icon" }}
          closeButtonText="close"
          onClose={() => {}}
        />
      );
    });
    expect(viewState.showTerriaSidePanel).toBe(false);
  });

  it("shows the terria sidepanel when closed", async function() {
    await act(() => {
      testRenderer = TestRenderer.create(
        <WorkflowPanel
          viewState={viewState}
          title="test"
          icon={{ id: "test-icon" }}
          closeButtonText="close"
          onClose={() => {}}
        />
      );
    });
    expect(viewState.showTerriaSidePanel).toBe(false);
    testRenderer.unmount();
    expect(viewState.showTerriaSidePanel).toBe(true);
  });
});
