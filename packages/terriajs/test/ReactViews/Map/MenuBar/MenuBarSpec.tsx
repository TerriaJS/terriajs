import { screen } from "@testing-library/react";
import Terria from "../../../../lib/Models/Terria";
import ViewState from "../../../../lib/ReactViewModels/ViewState";
import MenuBar from "../../../../lib/ReactViews/Map/MenuBar/MenuBar";
import { renderWithContexts } from "../../withContext";

describe("MenuBar", function () {
  let terria: Terria;
  let viewState: ViewState;

  beforeEach(function () {
    terria = new Terria({ baseUrl: "./" });
    viewState = new ViewState({ terria });
  });

  function renderMenuBar() {
    return renderWithContexts(
      <MenuBar menuItems={[]} menuLeftItems={[]} />,
      viewState
    );
  }

  describe("the menu-bar-help element", function () {
    it("renders the help button when nothing hides it", function () {
      renderMenuBar();

      expect(screen.queryByText("helpPanel.btnText")).toBeVisible();
    });

    it("does not render the help button when the element is hidden", function () {
      terria.elements.set("menu-bar-help", { visible: false });
      renderMenuBar();

      expect(screen.queryByText("helpPanel.btnText")).toBeNull();
    });

    // A group is rounded at its ends through `:first-child` and `:last-child`,
    // so an item left behind by a hidden control still counts as the last one
    // and squares off the outer edge of the button beside it.
    it("takes the list item with it, leaving none empty", function () {
      terria.elements.set("menu-bar-help", { visible: false });
      const { container } = renderMenuBar();

      const items = Array.from(container.querySelectorAll("li"));
      expect(items.length).toBeGreaterThan(0);
      items.forEach(function (item) {
        expect(item.childElementCount).toBeGreaterThan(0);
      });
    });
  });
});
