import React from "react";
import {
  create,
  act,
  ReactTestRenderer,
  ReactTestInstance
} from "react-test-renderer";
import { assertObject } from "../../../../lib/Core/Json";
import SearchableItemMixin from "../../../../lib/ModelMixins/SearchableItemMixin";
import CommonStrata from "../../../../lib/Models/CommonStrata";
import CreateModel from "../../../../lib/Models/CreateModel";
import ItemSearchProvider, {
  ItemSearchParameter,
  ItemSearchResult
} from "../../../../lib/Models/ItemSearchProvider";
import ItemSearchProviders from "../../../../lib/Models/ItemSearchProviders";
import Terria from "../../../../lib/Models/Terria";
import ViewState from "../../../../lib/ReactViewModels/ViewState";
import ItemSearchTool, {
  ErrorComponent,
  PropsType
} from "../../../../lib/ReactViews/Tools/ItemSearchTool/ItemSearchTool";
import SearchForm from "../../../../lib/ReactViews/Tools/ItemSearchTool/SearchForm";
import SearchResults from "../../../../lib/ReactViews/Tools/ItemSearchTool/SearchResults";
import { ProgressText } from "../../../../lib/ReactViews/Tools/ToolModal";
import SearchableItemTraits from "../../../../lib/Traits/SearchableItemTraits";
import { withThemeContext } from "../../withThemeContext";

class TestSearchableItem extends SearchableItemMixin(
  CreateModel(SearchableItemTraits)
) {
  selectItemSearchResult(idPropertyName: string, idPropertyValue: string) {}
  unselectItemSearchResult(idPropertyName: string, idPropertyValue: string) {}
}

class TestItemSearchProvider extends ItemSearchProvider {
  async load(): Promise<void> {
    return;
  }

  async describeParameters(): Promise<ItemSearchParameter[]> {
    return [];
  }

  async search(): Promise<ItemSearchResult[]> {
    return [];
  }

  getIdPropertyName() {
    return "testId";
  }
}

describe("ItemSearchTool", function() {
  let viewState: ViewState;
  let item: TestSearchableItem;
  let itemSearchProvider: ItemSearchProvider;
  let rendered: ReactTestRenderer;

  beforeEach(function() {
    ItemSearchProviders.set("testProvider", TestItemSearchProvider);
    const terria: Terria = new Terria();
    viewState = new ViewState({
      terria,
      catalogSearchProvider: null,
      locationSearchProviders: []
    });
    item = new TestSearchableItem("test", terria);
    item.setTrait(CommonStrata.user, "search", {
      providerType: "testProvider",
      options: {},
      resultTemplate: undefined,
      highlightColor: undefined
    });
    const provider = item.createItemSearchProvider();
    assertObject(provider);
    itemSearchProvider = provider;
  });

  it("can be rendered", function() {
    act(() => {
      rendered = render({ item, itemSearchProvider, viewState });
    });
    const component = rendered.root.findByType(ItemSearchTool);
    expect(component).toBeDefined();
  });

  it("loads an describes the parameters when mounted", async function() {
    spyOn(itemSearchProvider, "load").and.callThrough();
    spyOn(itemSearchProvider, "describeParameters").and.callThrough();
    await act(() => {
      rendered = render({
        item,
        itemSearchProvider,
        viewState
      });
    });
    expect(itemSearchProvider.load).toHaveBeenCalledTimes(1);
    expect(itemSearchProvider.describeParameters).toHaveBeenCalledTimes(1);
  });

  describe("loading", function() {
    it("shows a progress text while loading", function() {
      act(() => {
        rendered = render({
          item,
          itemSearchProvider,
          viewState
        });
      });
      const progressText = rendered.root.findByType(ProgressText);
      expect(progressText).toBeDefined();
      expect(progressText.props.children).toEqual("itemSearchTool.loading");
    });

    it("shows an error message on load error", async function() {
      spyOn(itemSearchProvider, "describeParameters").and.callFake(() =>
        Promise.reject(new Error(`Something happened`))
      );

      rendered = await renderAndLoad({
        item,
        itemSearchProvider,
        viewState
      });

      const error = rendered.root.findByType(ErrorComponent);
      expect(error).toBeDefined();
      expect(error.props.children).toEqual("Something happened");
    });

    it("shows a search from on successful load", async function() {
      spyOn(itemSearchProvider, "describeParameters").and.callFake(() =>
        Promise.resolve([])
      );
      rendered = await renderAndLoad({
        item,
        itemSearchProvider,
        viewState
      });
      const searchForm = rendered.root.findByType(SearchForm);
      expect(searchForm).toBeDefined();
    });

    describe("search form", function() {
      it("triggers search when submitted", async function() {
        const searchSpy = spyOn(itemSearchProvider, "search").and.callThrough();
        rendered = await renderAndLoad({
          item,
          itemSearchProvider,
          viewState
        });
        const searchForm = rendered.root.findByType(SearchForm);
        searchForm.props.onSubmit({ foo: "bar" });
        expect(itemSearchProvider.search).toHaveBeenCalledTimes(1);
        const parameterValues: Map<string, any> = searchSpy.calls.mostRecent()
          .args[0];
        expect(parameterValues).toBeDefined();
        expect([...parameterValues.entries()]).toEqual([["foo", "bar"]]);
      });
    });

    describe("when searching", function() {
      it("shows progress text", async function() {
        spyOn(itemSearchProvider, "search").and.callFake(
          // Pass an unresolving promise so that we can test the intermediate state
          () => new Promise(() => {})
        );
        const { root } = await renderAndLoad({
          item,
          itemSearchProvider,
          viewState
        });
        await submitForm(root, { foo: "bar" });
        const searchProgress = root.findByType(ProgressText);
        expect(searchProgress.props.children).toEqual(
          "itemSearchTool.searching"
        );
      });

      it("disables the search form", async function() {
        spyOn(itemSearchProvider, "search").and.callFake(
          // Pass an unresolving promise so that we can test the intermediate state
          () => new Promise(() => {})
        );
        const { root } = await renderAndLoad({
          item,
          itemSearchProvider,
          viewState
        });
        const searchForm = await submitForm(root, { foo: "bar" });
        expect(searchForm.props.disabled).toEqual(true);
      });

      it("on error, shows the error", async function() {
        spyOn(itemSearchProvider, "search").and.callFake(() =>
          Promise.reject(Error(`Something is wrong`))
        );
        const { root } = await renderAndLoad({
          item,
          itemSearchProvider,
          viewState
        });
        await submitForm(root, { foo: "bar" });
        const error = root.findByType(ErrorComponent);
        expect(error.props.title).toBe("itemSearchTool.searchError");
      });

      it("on success, it shows the search results", async function() {
        spyOn(itemSearchProvider, "search").and.callFake(() =>
          Promise.resolve([])
        );

        const { root } = await renderAndLoad({
          item,
          itemSearchProvider,
          viewState
        });
        await submitForm(root, { foo: "bar" });
        const searchResults = root.findByType(SearchResults);
        expect(searchResults).toBeDefined();
      });
    });
  });
});

function render(props: Omit<PropsType, "i18n" | "t" | "tReady">) {
  return create(withThemeContext(<ItemSearchTool {...props} />));
}

function renderAndLoad(
  props: Omit<PropsType, "i18n" | "t" | "tReady">
): Promise<ReactTestRenderer> {
  return new Promise(resolve => {
    act(() => {
      const rendered = render({
        ...props,
        afterLoad: () => resolve(rendered)
      });
    });
  });
}

async function submitForm(
  root: ReactTestInstance,
  parameterValues: Record<string, any>
): Promise<ReactTestInstance> {
  const searchForm = root.findByType(SearchForm);
  expect(searchForm).toBeDefined();
  await act(() => searchForm.props.onSubmit(parameterValues));
  return searchForm;
}
