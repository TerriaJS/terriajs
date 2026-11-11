import { fireEvent, render, waitFor } from "@testing-library/react";
import i18next from "i18next";
import CommonStrata from "../../../../../lib/Models/Definition/CommonStrata";
import updateModelFromJson from "../../../../../lib/Models/Definition/updateModelFromJson";
import Terria from "../../../../../lib/Models/Terria";
import ViewState from "../../../../../lib/ReactViewModels/ViewState";
import CountDatasets from "../../../../../lib/ReactViews/Map/Panels/ToolsPanel/CountDatasets";
import { renderWithContexts } from "../../../withContext";

const payload = '<img src="x" onerror="alert(1)">';

describe("CountDatasets", function () {
  let terria: Terria;
  let viewState: ViewState;

  beforeEach(async function () {
    await i18next.changeLanguage("en");
    terria = new Terria({ baseUrl: "./" });
    viewState = new ViewState({ terria });
    updateModelFromJson(terria.catalog.group, CommonStrata.definition, {
      members: [
        {
          type: "group",
          name: payload,
          members: [{ type: "group", name: "child", members: [] }]
        }
      ]
    }).throwIfError();
  });

  afterEach(async function () {
    await i18next.changeLanguage("cimode");
  });

  it("shows catalog group names as text in the results", async function () {
    const updateResults = jasmine.createSpy("updateResults");
    const { getByRole } = renderWithContexts(
      <CountDatasets updateResults={updateResults} />,
      viewState
    );

    fireEvent.click(getByRole("button"));
    await waitFor(() => {
      if (updateResults.calls.count() < 1) throw new Error("not counted yet");
    });

    const { container } = render(
      <div>{updateResults.calls.mostRecent().args[0]}</div>
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain(`${payload}: 0 items / 1 groups`);
    expect(container.textContent).not.toContain("<div>");
  });
});
