import { render, within } from "@testing-library/react";
import i18next from "i18next";
import { ItemSearchResult } from "../../../../lib/Models/ItemSearchProviders/ItemSearchProvider";
import Terria from "../../../../lib/Models/Terria";
import SearchResults from "../../../../lib/ReactViews/Tools/ItemSearchTool/SearchResults";
import MockSearchableItem from "./MockSearchableItem";

describe("SearchResults", function () {
  beforeAll(async () => {
    await i18next.changeLanguage("en");
  });
  afterAll(async () => {
    await i18next.changeLanguage("cimode");
  });
  it("shows the results count", async function () {
    const { container } = render(
      <SearchResults
        item={new MockSearchableItem(undefined, new Terria())}
        results={sampleResults(20)}
      />
    );

    expect(within(container).getByText("20 matches found")).toBeVisible();
  });
});

function sampleResults(count: number): ItemSearchResult[] {
  return [...Array(count)].map((_, i) => ({
    id: `building-${i}`,
    idPropertyName: "building-id",
    featureCoordinate: {
      latitudeDegrees: 45,
      longitudeDegrees: 100,
      featureHeight: 200
    },
    properties: {
      name: `bldg-${i}`
    }
  }));
}
