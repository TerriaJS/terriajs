import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18next from "i18next";
import { runInAction } from "mobx";
import runLater from "../../../lib/Core/runLater";
import CatalogMemberMixin from "../../../lib/ModelMixins/CatalogMemberMixin";
import WebMapServiceCatalogItem from "../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import WebProcessingServiceCatalogFunction from "../../../lib/Models/Catalog/Ows/WebProcessingServiceCatalogFunction";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import DataCatalogItem from "../../../lib/ReactViews/DataCatalog/DataCatalogItem";
import { withThemeContext } from "../withContext";

describe("DataCatalogItem", () => {
  let terria: Terria;
  let viewState: ViewState;
  let item: CatalogMemberMixin.Instance;
  let wmsItem: WebMapServiceCatalogItem;
  let removable: boolean;

  beforeAll(async () => {
    await i18next.changeLanguage("en");
  });

  beforeEach(async () => {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: undefined
    });
    wmsItem = new WebMapServiceCatalogItem("test", terria);

    runInAction(() => {
      viewState.explorerPanelIsVisible = true;
      viewState.mobileView = viewState.mobileViewOptions.data;

      wmsItem.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
    });

    // Use wmsItem for most tests, except for a couple that need to use a WPS item
    item = wmsItem;

    removable = false;

    spyOn(viewState, "viewCatalogMember").and.callThrough();
    spyOn(viewState, "switchMobileView");
  });

  afterAll(async function () {
    await i18next.changeLanguage("cimode");
  });

  it("text click", async () => {
    render(
      withThemeContext(
        <DataCatalogItem
          viewState={viewState}
          item={item}
          removable={removable}
          terria={terria}
        />
      )
    );

    await userEvent.click(screen.getByRole("button", { name: item.name }));

    expect(viewState.viewCatalogMember).toHaveBeenCalledWith(item);
    expect(viewState.switchMobileView).toHaveBeenCalledWith(
      viewState.mobileViewOptions.preview
    );
    expect(terria.workbench.contains(item)).toBe(false);
  });

  describe("button click", () => {
    it("when not on mobile and with a non-invokeable layer and not user supplied", async () => {
      render(
        withThemeContext(
          <DataCatalogItem
            viewState={viewState}
            item={item}
            removable={removable}
            terria={terria}
          />
        )
      );

      await userEvent.click(screen.getByRole("button", { name: "Add" }));

      expect(terria.workbench.contains(item)).toBe(true);
    });

    it("when on mobile and not user supplied", async () => {
      runInAction(() => {
        viewState.useSmallScreenInterface = true;
      });
      render(
        withThemeContext(
          <DataCatalogItem
            viewState={viewState}
            item={item}
            removable={removable}
            terria={terria}
          />
        )
      );

      await userEvent.click(screen.getByRole("button", { name: "Preview" }));

      expect(viewState.viewCatalogMember).toHaveBeenCalledWith(item);
      expect(viewState.switchMobileView).toHaveBeenCalledWith(
        viewState.mobileViewOptions.preview
      );
      expect(terria.workbench.contains(item)).toBe(false);
    });

    it("when with an invokeable layer", async () => {
      item = new WebProcessingServiceCatalogFunction("test-wps", terria);
      render(
        withThemeContext(
          <DataCatalogItem
            viewState={viewState}
            item={item}
            removable={removable}
            terria={terria}
          />
        )
      );

      await userEvent.click(screen.getByRole("button", { name: "" }));

      expect(viewState.viewCatalogMember).toHaveBeenCalledWith(item);
      expect(viewState.switchMobileView).toHaveBeenCalledWith(
        viewState.mobileViewOptions.preview
      );
      expect(terria.workbench.contains(item)).toBe(false);
    });

    describe("close modal after added data when not user supplied", () => {
      it("closes the explorer panel visible", async () => {
        render(
          withThemeContext(
            <DataCatalogItem
              viewState={viewState}
              item={item}
              removable={removable}
              terria={terria}
            />
          )
        );

        await userEvent.click(screen.getByRole("button", { name: "Add" }));

        // runLater is needed to wait for the state to update after the click, which then causes the explorer panel to close
        await runLater(() => {}, 100);
        expect(viewState.explorerPanelIsVisible).toBe(false);
      });

      it("doesn't close the explorer panel if keepCatalogOpen is set", async () => {
        runInAction(() => {
          terria.configParameters.keepCatalogOpen = true;
        });
        render(
          withThemeContext(
            <DataCatalogItem
              viewState={viewState}
              item={item}
              removable={removable}
              terria={terria}
            />
          )
        );

        await userEvent.click(screen.getByRole("button", { name: "Add" }));
        await runLater(() => {}, 100);
        expect(viewState.explorerPanelIsVisible).toBe(true);
      });
    });

    describe("does not close modal", () => {
      it("when control key pressed", async () => {
        const user = userEvent.setup();

        render(
          withThemeContext(
            <DataCatalogItem
              viewState={viewState}
              item={item}
              removable={removable}
              terria={terria}
            />
          )
        );
        await user.keyboard("{Control>}");
        await user.click(screen.getByRole("button", { name: "Add" }));
        await user.keyboard("{/Control}");

        expect(viewState.explorerPanelIsVisible).toBe(true);
        expect(viewState.mobileView).not.toBeNull();
      });

      it("when shift key pressed", async () => {
        const user = userEvent.setup();

        render(
          withThemeContext(
            <DataCatalogItem
              viewState={viewState}
              item={item}
              removable={removable}
              terria={terria}
            />
          )
        );

        await user.keyboard("{Shift>}");
        await user.click(screen.getByRole("button", { name: "Add" }));
        await user.keyboard("{/Shift}");

        expect(viewState.explorerPanelIsVisible).toBe(true);
        expect(viewState.mobileView).not.toBeNull();
      });
    });
  });

  describe("renders", () => {
    it("a single <CatalogItem />", () => {
      render(
        withThemeContext(
          <DataCatalogItem
            viewState={viewState}
            item={item}
            removable={removable}
            terria={terria}
          />
        )
      );

      expect(screen.getAllByRole("button", { name: "Add" }).length).toBe(1);
    });

    describe("btnState prop as", () => {
      it('"loading" if item is loading', () => {
        runInAction(() => {
          (wmsItem as any)._metadataLoader._isLoading = true;
          viewState.useSmallScreenInterface = true;
        });

        render(
          withThemeContext(
            <DataCatalogItem
              viewState={viewState}
              item={item}
              removable={removable}
              terria={terria}
            />
          )
        );

        expect(screen.getAllByRole("button").length).toBe(2);
        expect(
          screen.getByRole("button", { name: "Loading..." })
        ).toBeVisible();
      });

      it('"preview" if on mobile and not loading', () => {
        runInAction(() => {
          viewState.useSmallScreenInterface = true;
        });
        render(
          withThemeContext(
            <DataCatalogItem
              viewState={viewState}
              item={item}
              removable={removable}
              terria={terria}
            />
          )
        );

        expect(screen.getAllByRole("button").length).toBe(2);
        expect(screen.getByRole("button", { name: "Preview" })).toBeVisible();
      });

      it('"remove" if item is enabled and not loading and not on mobile', async () => {
        // user supplied data does not have add/remove button, regardless
        // if they have trash button
        await terria.workbench.add(wmsItem);
        render(
          withThemeContext(
            <DataCatalogItem
              viewState={viewState}
              item={item}
              removable={removable}
              terria={terria}
            />
          )
        );

        expect(screen.getAllByRole("button").length).toBe(2);
        expect(
          screen.getByRole("button", { name: "Remove from map" })
        ).toBeVisible();
      });

      it('"add" if item removable but NOT enabled', () => {
        // If removable, btnstate should still be add or remove
        removable = true;
        render(
          withThemeContext(
            <DataCatalogItem
              viewState={viewState}
              item={item}
              removable={removable}
              terria={terria}
            />
          )
        );

        expect(screen.getAllByRole("button").length).toBe(3);
        expect(screen.getByRole("button", { name: "Add" })).toBeVisible();
        expect(
          screen.queryByRole("button", { name: "Remove from catalogue" })
        ).toBeVisible();
      });

      it('"remove" if item removable but enabled', async () => {
        // If removable, btnstate should still be add or remove
        await terria.workbench.add(wmsItem);
        removable = true;
        render(
          withThemeContext(
            <DataCatalogItem
              viewState={viewState}
              item={item}
              removable={removable}
              terria={terria}
            />
          )
        );

        expect(screen.getAllByRole("button").length).toBe(3);
        expect(
          screen.getByRole("button", { name: "Remove from map" })
        ).toBeVisible();
        expect(
          screen.queryByRole("button", { name: "Remove from catalogue" })
        ).toBeVisible();
      });

      it('"add" if item is not invokeable, not enabled and not loading and not on mobile', () => {
        render(
          withThemeContext(
            <DataCatalogItem
              viewState={viewState}
              item={item}
              removable={removable}
              terria={terria}
            />
          )
        );

        expect(screen.getAllByRole("button").length).toBe(2);
        expect(screen.getByRole("button", { name: "Add" })).toBeVisible();
      });

      it('"stats" if item is invokeable, not user-supplied, not enabled and not loading and not on mobile', () => {
        item = new WebProcessingServiceCatalogFunction("test-wps", terria);

        render(
          withThemeContext(
            <DataCatalogItem
              viewState={viewState}
              item={item}
              removable={removable}
              terria={terria}
            />
          )
        );

        expect(screen.getAllByRole("button").length).toBe(2);
        expect(screen.getByRole("button", { name: "" })).toBeVisible();
      });
    });

    it("sets the CatalogItem text as the item name", () => {
      wmsItem.setTrait(CommonStrata.definition, "name", "TEST!!!");

      render(
        withThemeContext(
          <DataCatalogItem
            viewState={viewState}
            item={item}
            removable={removable}
            terria={terria}
          />
        )
      );

      expect(screen.getByText("TEST!!!")).toBeVisible();
    });
  });
});
