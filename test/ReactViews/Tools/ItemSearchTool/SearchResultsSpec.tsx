import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import BoundingSphere from "terriajs-cesium/Source/Core/BoundingSphere";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import { ItemSearchResult } from "../../../../lib/Models/ItemSearchProvider";
import SearchResults, {
  List,
  ResultsCount,
  SearchResultsProps
} from "../../../../lib/ReactViews/Tools/ItemSearchTool/SearchResults";

describe("SearchResults", function() {
  it("it shows a list results", async function() {
    const { root } = await render({
      results: randomResults(7),
      onClickResult: () => {}
    });
    const list = root.findByType(List);
    expect(list.props).toEqual(
      jasmine.objectContaining({
        itemCount: 7
      })
    );
  });

  it("shows the results count", async function() {
    const { root } = await render({
      results: randomResults(20),
      onClickResult: () => {}
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
  return [...Array(count)].map(() => ({
    id: `building-${Math.random()}`,
    zoomToTarget: {
      boundingSphere: new BoundingSphere(center, radius)
    },
    properties: {
      name: `bldg-${randomColor()}-${Math.random()}`,
      address: `${Math.random()}/${Math.random()} ${randomColor()} Street`
    }
  }));
}

function randomRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const colors = ["red", "blue", "green", "yellow", "orange", "grey"];

const randomColor = () => {
  const idx = Math.floor(Math.random() * colors.length);
  return colors[idx];
};
