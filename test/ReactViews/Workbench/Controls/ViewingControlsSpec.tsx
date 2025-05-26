import ViewingControls from "../../../../lib/ReactViews/Workbench/Controls/ViewingControls";
import Terria from "../../../../lib/Models/Terria";
import ViewState from "../../../../lib/ReactViewModels/ViewState";
import SimpleCatalogItem from "../../../Helpers/SimpleCatalogItem";
import * as ViewingControlsMenu from "../../../../lib/ViewModels/ViewingControlsMenu";
import Icon from "../../../../lib/Styled/Icon";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("ViewingControls", function () {
  let terria: Terria;
  let viewState: ViewState;

  beforeEach(function () {
    terria = new Terria();
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined
    });
  });

  it("renders the viewing controls buttons", () => {
    const simpleItem = new SimpleCatalogItem("simple", terria);
    render(<ViewingControls viewState={viewState} item={simpleItem} />);

    expect(
      screen.getByRole("button", { name: "workbench.zoomTo" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "workbench.previewItem" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "workbench.showMoreActionsTitle" })
    ).toBeVisible();
  });

  it("shows viewing controls added through `viewState.globalViewingControls`", async () => {
    const simpleItem = new SimpleCatalogItem("simple", terria);

    ViewingControlsMenu.addMenuItem(viewState, () => ({
      name: "View details",
      icon: Icon.GLYPHS.eye,
      iconTitle: "View more details",
      onClick: () => {}
    }));
    render(<ViewingControls viewState={viewState} item={simpleItem} />);

    await userEvent.click(
      screen.getByRole("button", { name: "workbench.showMoreActionsTitle" })
    );

    expect(screen.getByText("View details")).toBeVisible();
    expect(screen.getByTitle("View more details")).toBeVisible();
  });

  it("should close menu on click outside", async () => {
    const simpleItem = new SimpleCatalogItem("simple", terria);

    ViewingControlsMenu.addMenuItem(viewState, () => ({
      name: "View details",
      icon: Icon.GLYPHS.eye,
      iconTitle: "View more details",
      onClick: () => {}
    }));

    render(<ViewingControls viewState={viewState} item={simpleItem} />);

    await userEvent.click(
      screen.getByRole("button", {
        name: "workbench.showMoreActionsTitle"
      })
    );

    expect(screen.getByText("View details")).toBeVisible();

    await userEvent.click(
      screen.getByRole("button", {
        name: "workbench.previewItem"
      })
    );

    expect(screen.queryByText("View details")).not.toBeInTheDocument();
  });
});
