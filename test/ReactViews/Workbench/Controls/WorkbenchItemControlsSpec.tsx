import { fireEvent, screen } from "@testing-library/dom";
import GeoJsonCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import WebMapServiceCatalogItem from "../../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import updateModelFromJson from "../../../../lib/Models/Definition/updateModelFromJson";
import Terria from "../../../../lib/Models/Terria";
import TableStylingWorkflow from "../../../../lib/Models/Workflows/TableStylingWorkflow";
import ViewState from "../../../../lib/ReactViewModels/ViewState";
import { WorkbenchControls } from "../../../../lib/ReactViews/Workbench/Controls/WorkbenchControls";
import WorkbenchItemControls from "../../../../lib/ReactViews/Workbench/Controls/WorkbenchItemControls";
import { renderWithContexts } from "../../withContext";

describe("WorkbenchItemControls", function () {
  let viewState: ViewState;
  let item: WebMapServiceCatalogItem;

  beforeEach(function () {
    const terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: undefined
    });

    item = new WebMapServiceCatalogItem("test-item", terria);
  });

  it("renders controls", function () {
    renderWithContexts(
      <WorkbenchItemControls item={item} viewState={viewState} />,
      viewState
    );

    const aboutData = screen.queryByTitle("workbench.previewItemTitle");
    expect((aboutData as HTMLButtonElement).disabled).toBe(false);

    const opacity = screen.queryByText("workbench.opacity");
    expect(opacity).toBeVisible();
  });

  describe("disableViewingControlsMenu", function () {
    it("when not set, renders the viewing controls menu", function () {
      renderWithContexts(
        <WorkbenchItemControls item={item} viewState={viewState} />,
        viewState
      );

      const opacity = screen.queryByText("workbench.opacity");
      expect(opacity).toBeVisible();
    });

    it("when true, should not render the viewing controls menu", function () {
      renderWithContexts(
        <WorkbenchItemControls
          item={item}
          viewState={viewState}
          disableViewingControlsMenu
        />,
        viewState
      );

      // About data is part of viewing controls menu
      const aboutData = screen.queryByText("workbench.previewItem");
      expect(aboutData).toBeNull();
    });
  });

  describe("control flags", function () {
    it("can be used to selectively turn off controls", function () {
      renderWithContexts(
        <WorkbenchItemControls
          item={item}
          viewState={viewState}
          controls={{
            compare: false,
            opacity: false
          }}
        />,
        viewState
      );

      const compare = screen.queryByText("workbench.splitItemTitle");
      expect(compare).toBeNull();

      const opacity = screen.queryByText("workbench.opacity");
      expect(opacity).toBeNull();
    });

    it("can be used to disable a dynamic control like a selectable dimension workflow", function () {
      const item = new GeoJsonCatalogItem(
        "test-geojson-item",
        viewState.terria
      );

      const { rerender } = renderWithContexts(
        <WorkbenchItemControls item={item} viewState={viewState} />,
        viewState
      );

      openViewingControlsMenu();

      // Test that the edit style option is rendered
      let editStyle = screen.queryByText("models.tableData.editStyle");
      expect(editStyle).toBeVisible();

      rerender(
        <WorkbenchItemControls
          item={item}
          viewState={viewState}
          controls={{ [TableStylingWorkflow.type]: false }}
        />
      );

      openViewingControlsMenu();

      // Test that the edit style option is not rendered
      editStyle = screen.queryByText("models.tableData.editStyle");
      expect(editStyle).toBeNull("edit style menu option must not be rendered");
    });

    describe("when disableAll is true", function () {
      it("turns off all controls", function () {
        renderWithContexts(
          <WorkbenchItemControls
            item={item}
            viewState={viewState}
            controls={{
              disableAll: true
            }}
          />,
          viewState
        );

        const aboutData = screen.queryByTitle("workbench.previewItemTitle");
        expect((aboutData as HTMLButtonElement).disabled).toBe(true);

        const compare = screen.queryByText("workbench.splitItemTitle");
        expect(compare).toBeNull();

        const opacity = screen.queryByText("workbench.opacity");
        expect(opacity).toBeNull();
      });

      it("shows Remove button in viewing controls menu so that the item can be removed from the workbench even when all other controls are disabled", async function () {
        renderWithContexts(
          <WorkbenchItemControls
            item={item}
            viewState={viewState}
            controls={{
              disableAll: true
            }}
          />,
          viewState
        );

        openViewingControlsMenu();

        // Test that the remove button is rendered
        const remove = screen.queryByTitle("workbench.removeFromMapTitle");
        expect(remove).toBeVisible();
      });

      it("can selectively enable some controls while the rest are disabled", function () {
        renderWithContexts(
          <WorkbenchItemControls
            item={item}
            viewState={viewState}
            controls={{
              disableAll: true,
              opacity: true
            }}
          />,
          viewState
        );

        const aboutData = screen.queryByTitle("workbench.previewItemTitle");
        expect((aboutData as HTMLButtonElement).disabled).toBe(true);

        const compare = screen.queryByText("workbench.splitItemTitle");
        expect(compare).toBeNull();

        const opacity = screen.queryByText("workbench.opacity");
        expect(opacity).toBeVisible();
      });
    });

    describe("setting controls through item traits", function () {
      it("control flags can be set using item traits", function () {
        updateModelFromJson(item, CommonStrata.user, {
          workbenchControlFlags: {
            disableAll: true,
            opacity: true
          }
        });

        const controls =
          item.workbenchControlFlags as any as Partial<WorkbenchControls>;
        expect(controls.disableAll).toBe(true);

        renderWithContexts(
          <WorkbenchItemControls item={item} viewState={viewState} />,
          viewState
        );

        const aboutData = screen.queryByTitle("workbench.previewItemTitle");
        expect((aboutData as HTMLButtonElement).disabled).toBe(true);

        const opacity = screen.queryByText("workbench.opacity");
        expect(opacity).toBeVisible();
      });

      it("controls set from item traits must not override props controls", function () {
        updateModelFromJson(item, CommonStrata.user, {
          workbenchControlFlags: {
            disableAll: true,
            opacity: true
          }
        });

        renderWithContexts(
          <WorkbenchItemControls
            item={item}
            viewState={viewState}
            controls={{ disableAll: false, opacity: false }}
          />,
          viewState
        );

        const aboutData = screen.queryByTitle("workbench.previewItemTitle");
        expect((aboutData as HTMLButtonElement).disabled).toBe(false);

        const opacity = screen.queryByText("workbench.opacity");
        expect(opacity).toBeNull();
      });
    });
  });
});

function openViewingControlsMenu() {
  // Find and open viewing controls menu
  const menuOpenBtn = screen.queryByTitle("workbench.showMoreActionsTitle");
  expect(menuOpenBtn).toBeDefined("viewing controls menu button is defined");
  fireEvent.click(menuOpenBtn!);
}
