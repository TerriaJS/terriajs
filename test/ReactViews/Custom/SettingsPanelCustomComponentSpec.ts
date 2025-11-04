import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import parseCustomMarkdownToReact from "../../../lib/ReactViews/Custom/parseCustomMarkdownToReact";
import registerCustomComponentTypes from "../../../lib/ReactViews/Custom/registerCustomComponentTypes";
import { renderWithContexts } from "../withContext";
import CustomComponent from "../../../lib/ReactViews/Custom/CustomComponent";

describe("SettingsPanelCustomComponent", function () {
  let viewState: ViewState;

  beforeEach(function () {
    viewState = new ViewState({
      terria: new Terria(),
      catalogSearchProvider: undefined
    });

    registerCustomComponentTypes(viewState.terria);
  });

  afterEach(function () {
    CustomComponent.unregisterAll();
  });

  it("renders", function () {
    renderWithContexts(
      parseCustomMarkdownToReact(
        "Click to open <settingspanel title='Settings' />"
      ),
      viewState
    );

    const settingsLink = screen.queryByTitle("Settings");
    expect(settingsLink).toBeVisible();
  });

  it("opens the settings panel when clicked", async function () {
    renderWithContexts(
      parseCustomMarkdownToReact(
        "Click to open <settingspanel title='Settings' />"
      ),
      viewState
    );

    const settingsLink = screen.queryByTitle("Settings");
    expect(settingsLink).toBeDefined();
    expect(viewState.settingsPanelIsVisible).toBe(false);
    await userEvent.click(settingsLink!);
    expect(viewState.settingsPanelIsVisible).toBe(true);
  });
});
