import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import ItemSearchProvider, {
  ItemSearchParameter,
  ItemSearchResult
} from "../../../../lib/Models/ItemSearchProviders/ItemSearchProvider";
import { registerItemSearchProvider } from "../../../../lib/Models/ItemSearchProviders/ItemSearchProviders";
import Terria from "../../../../lib/Models/Terria";
import ViewState from "../../../../lib/ReactViewModels/ViewState";
import ItemSearchTool from "../../../../lib/ReactViews/Tools/ItemSearchTool/ItemSearchTool";
import { withThemeContext } from "../../withContext";
import MockSearchableItem from "./MockSearchableItem";
import i18next from "i18next";

class TestItemSearchProvider extends ItemSearchProvider {
  async initialize(): Promise<void> {
    return;
  }

  describeParameters(): Promise<ItemSearchParameter[]> {
    return Promise.resolve([
      {
        type: "numeric",
        id: "height",
        name: "Height",
        range: { min: 1, max: 200 }
      }
    ]);
  }

  search(): Promise<ItemSearchResult[]> {
    return Promise.resolve([]);
  }
}

describe("ItemSearchTool", function () {
  let viewState: ViewState;
  let item: MockSearchableItem;
  let itemSearchProvider: ItemSearchProvider;

  beforeAll(async function () {
    await i18next.changeLanguage("en");
  });

  beforeEach(async function () {
    registerItemSearchProvider("testProvider", TestItemSearchProvider);
    const terria: Terria = new Terria();
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined
    });
    item = new MockSearchableItem("test", terria);
    item.setTrait(CommonStrata.user, "search", {
      providerType: "testProvider",
      providerOptions: {},
      resultTemplate: undefined,
      highlightColor: undefined,
      parameters: []
    });
    const provider = item.createItemSearchProvider();
    if (provider) {
      itemSearchProvider = provider;
    } else {
      throw new Error("item.createItemSearchProvider returned undefined");
    }
  });

  afterAll(async function () {
    await i18next.changeLanguage("cimode");
  });

  it("can be rendered", async function () {
    render(
      withThemeContext(
        <ItemSearchTool
          item={item}
          itemSearchProvider={itemSearchProvider}
          viewState={viewState}
        />
      )
    );

    expect(screen.getByText("Search Item")).toBeVisible();
    expect(screen.getByRole("button", { name: "Exit" })).toBeVisible();
    expect(screen.getByText("Loading search parameters")).toBeVisible();
  });

  it("initializes and describes the parameters when mounted", async function () {
    spyOn(itemSearchProvider, "initialize").and.callThrough();
    spyOn(itemSearchProvider, "describeParameters").and.callThrough();
    render(
      withThemeContext(
        <ItemSearchTool
          item={item}
          itemSearchProvider={itemSearchProvider}
          viewState={viewState}
        />
      )
    );

    await waitFor(() => {
      expect(itemSearchProvider.initialize).toHaveBeenCalledTimes(1);
    });
    expect(itemSearchProvider.describeParameters).toHaveBeenCalledTimes(1);
  });

  describe("loading", function () {
    it("shows an error message on load error", async function () {
      spyOn(itemSearchProvider, "describeParameters").and.callFake(() =>
        Promise.reject(new Error(`Something happened`))
      );

      render(
        withThemeContext(
          <ItemSearchTool
            item={item}
            itemSearchProvider={itemSearchProvider}
            viewState={viewState}
          />
        )
      );

      expect(screen.getByText("Loading search parameters")).toBeVisible();

      await waitFor(() => {
        expect(
          screen.getByText(
            "Error loading search parameters. Check console for detailed errors."
          )
        ).toBeVisible();
      });
    });

    it("shows a search from on successful load", async function () {
      spyOn(itemSearchProvider, "describeParameters").and.callFake(() =>
        Promise.resolve([
          {
            type: "numeric",
            id: "height",
            name: "Height",
            range: { min: 1, max: 180 }
          }
        ])
      );

      const { container } = render(
        withThemeContext(
          <ItemSearchTool
            item={item}
            itemSearchProvider={itemSearchProvider}
            viewState={viewState}
          />
        )
      );

      await waitFor(() => {
        expect(container.querySelector("form")).toBeVisible();
      });
    });

    it("it shows the search results", async function () {
      spyOn(itemSearchProvider, "search").and.callFake(() =>
        Promise.resolve([])
      );

      const { container } = render(
        withThemeContext(
          <ItemSearchTool
            item={item}
            itemSearchProvider={itemSearchProvider}
            viewState={viewState}
          />
        )
      );
      await waitFor(() => {
        expect(container.querySelector("form")).toBeVisible();
      });
      await userEvent.click(screen.getByRole("button", { name: "Search" }));
      await waitFor(() => {
        expect(within(container).getByText("0 matches found")).toBeVisible();
      });
    });
  });
});
