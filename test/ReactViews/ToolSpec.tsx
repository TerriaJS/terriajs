import { screen, waitFor } from "@testing-library/react";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
import Tool from "../../lib/ReactViews/Tools/Tool";
import { renderWithContexts } from "./withContext";

const TestComponent = () => <div>Test hello</div>;

describe("Tool", function () {
  let viewState: ViewState;

  beforeEach(function () {
    const terria = new Terria();
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined
    });
  });

  it("renders the item returned by getToolComponent", async function () {
    renderWithContexts(
      <Tool
        toolName="test-tool"
        getToolComponent={() => TestComponent as any}
      />,
      viewState
    );
    await waitFor(() => expect(screen.getByText("Test hello")).toBeVisible());
  });

  it("renders the promised item returned by getToolComponent", async function () {
    renderWithContexts(
      <Tool
        toolName="test-tool"
        getToolComponent={() => Promise.resolve(TestComponent as any)}
      />,
      viewState
    );
    await waitFor(() => expect(screen.getByText("Test hello")).toBeVisible());
  });
});
