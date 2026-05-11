import { render, within } from "@testing-library/react";
import i18next from "i18next";
import { ItemSearchResult } from "../../../../lib/Models/ItemSearchProviders/ItemSearchProvider";
import Terria from "../../../../lib/Models/Terria";
import SearchResults from "../../../../lib/ReactViews/Tools/ItemSearchTool/SearchResults";
import MockSearchableItem from "./MockSearchableItem";

describe("SearchResults", function () {
  let terria: Terria;
  beforeEach(async () => {
    terria = new Terria();
    (await terria.initLanguage()).build();
    await i18next.changeLanguage("en");
  });
  afterEach(async () => {
    await i18next.changeLanguage("cimode");
  });

  it("shows the results count", async function () {
    const { container } = render(
      <SearchResults
        item={new MockSearchableItem(undefined, terria)}
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
