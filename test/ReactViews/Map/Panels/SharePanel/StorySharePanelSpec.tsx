import { act } from "react-dom/test-utils";
import { withTheme } from "styled-components";
import Terria from "../../../../../lib/Models/Terria";
import ViewState from "../../../../../lib/ReactViewModels/ViewState";
import InnerPanel from "../../../../../lib/ReactViews/Map/Panels/InnerPanel";
import StorySharePanel from "../../../../../lib/ReactViews/Map/Panels/SharePanel/StorySharePanel";
import { createWithContexts } from "../../../withContext";

const ThemedStorySharePanel = withTheme(StorySharePanel as any);

describe("StorySharePanel", function () {
  let terria: Terria;
  let viewState: ViewState;
  let testRenderer: ReturnType<typeof createWithContexts>;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });

    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: undefined
    });
  });

  it("should render when not open", function () {
    act(() => {
      testRenderer = createWithContexts(viewState, <ThemedStorySharePanel />);
    });
    expect(testRenderer.toJSON()).not.toBeNull();
  });

  it("should render when open", function () {
    act(() => {
      testRenderer = createWithContexts(viewState, <ThemedStorySharePanel />);
    });

    const panel = testRenderer.root.findByType(StorySharePanel);
    act(() => {
      panel.instance.changeOpenState(true);
    });
    expect(testRenderer.root.findByType(InnerPanel)).toBeTruthy();
    expect(testRenderer.toJSON()).not.toBeNull();
  });
});
