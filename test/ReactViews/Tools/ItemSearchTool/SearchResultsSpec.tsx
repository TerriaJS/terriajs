import { act, create, ReactTestRenderer } from "react-test-renderer";
import { ItemSearchResult } from "../../../../lib/Models/ItemSearchProviders/ItemSearchProvider";
import Terria from "../../../../lib/Models/Terria";
import SearchResults, {
  ResultsCount,
  SearchResultsProps
} from "../../../../lib/ReactViews/Tools/ItemSearchTool/SearchResults";
import MockSearchableItem from "./MockSearchableItem";

describe("SearchResults", function () {
  it("shows the results count", async function () {
    const { root } = await render({
      item: new MockSearchableItem(undefined, new Terria()),
      results: sampleResults(20)
    });
    const resultsCount = root.findByType(ResultsCount);
    expect(resultsCount.props).toEqual(
      jasmine.objectContaining({
        count: 20
      })
    );
  });
});

function render(
  props: Omit<SearchResultsProps, "i18n" | "t" | "tReady">
): Promise<ReactTestRenderer> {
  let rendered: ReactTestRenderer;
  act(() => {
    rendered = create(<SearchResults {...props} />);
  });
  // @ts-expect-error assigned in callback
  return rendered;
}

function sampleResults(count: number): ItemSearchResult[] {
  return [...Array(count)].map((i) => ({
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
