import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import BoundingSphere from "terriajs-cesium/Source/Core/BoundingSphere";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import { ItemSearchResult } from "../../../../lib/Models/ItemSearchProvider";
import Terria from "../../../../lib/Models/Terria";
import SearchResults, {
  ResultsCount,
  SearchResultsProps
} from "../../../../lib/ReactViews/Tools/ItemSearchTool/SearchResults";
import MockSearchableItem from "./MockSearchableItem";

describe("SearchResults", function() {
  it("shows the results count", async function() {
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

async function render(
  props: Omit<SearchResultsProps, "i18n" | "t" | "tReady">
): Promise<ReactTestRenderer> {
  let rendered: ReactTestRenderer;
  await act(() => {
    rendered = create(<SearchResults {...props} />);
  });
  // @ts-ignore
  return rendered;
}

function sampleResults(count: number): ItemSearchResult[] {
  const center = Cartesian3.fromDegrees(100, 45);
  const radius = 200;
  return [...Array(count)].map(i => ({
    id: `building-${i}`,
    idPropertyName: "building-id",
    zoomToTarget: new BoundingSphere(center, radius),
    properties: {
      name: `bldg-${i}`
    }
  }));
}
