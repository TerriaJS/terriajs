import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18next from "i18next";
import ItemSearchProvider, {
  ItemSearchResult
} from "../../../../lib/Models/ItemSearchProviders/ItemSearchProvider";
import SearchForm from "../../../../lib/ReactViews/Tools/ItemSearchTool/SearchForm";

class TestItemSearchProvider extends ItemSearchProvider {
  async initialize() {}
  describeParameters() {
    return Promise.resolve([]);
  }
  search(): Promise<ItemSearchResult[]> {
    return Promise.resolve([
      {
        id: "1",
        idPropertyName: "building-id",
        featureCoordinate: {
          latitudeDegrees: 10,
          longitudeDegrees: 130,
          featureHeight: 42
        },
        properties: { foo: "bar" }
      }
    ]);
  }
}

describe("SearchForm", function () {
  beforeAll(async function () {
    await i18next.changeLanguage("en");
  });
  afterAll(async function () {
    await i18next.changeLanguage("cimode");
  });
  it("calls `onResults` after searching", async function () {
    const itemSearchProvider = new TestItemSearchProvider({}, []);
    const onResults = jasmine.createSpy("onResults");
    render(
      <SearchForm
        itemSearchProvider={itemSearchProvider}
        onResults={onResults}
        parameters={[
          {
            type: "numeric",
            id: "height",
            name: "Building height",
            range: { min: 10, max: 200 }
          }
        ]}
        query={{}}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(onResults).toHaveBeenCalled();
    });
    const [_, results] = onResults.calls.mostRecent().args;
    expect(results).toEqual(
      jasmine.arrayContaining([jasmine.objectContaining({ id: "1" })])
    );
  });
});
