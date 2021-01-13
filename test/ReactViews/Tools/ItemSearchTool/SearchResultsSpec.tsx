import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import BoundingSphere from "terriajs-cesium/Source/Core/BoundingSphere";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import { ItemSearchResult } from "../../../../lib/Models/ItemSearchProvider";
import SearchResults, {
  ResultsCount,
  SearchResultsProps
} from "../../../../lib/ReactViews/Tools/ItemSearchTool/SearchResults";

describe("SearchResults", function() {
  it("shows the results count", async function() {
    const { root } = await render({
      results: randomResults(20),
      onSelectResult: () => {}
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

function randomResults(count: number): ItemSearchResult[] {
  const center = Cartesian3.fromDegrees(
    randomRange(-180, 180),
    randomRange(-90, 90)
  );
  const radius = randomRange(400, 2000);
  return [...Array(count)].map(i => ({
    id: `building-${Math.random()}`,
    idPropertyName: "building-id",
    zoomToTarget: {
      boundingSphere: new BoundingSphere(center, radius)
    },
    properties: {
      name: `bldg-${i}`
    }
  }));
}

function randomRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
