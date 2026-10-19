import { render } from "@testing-library/react";
import { runInAction } from "mobx";
import WebMapServiceCatalogItem from "../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import Terria from "../../../lib/Models/Terria";
import Timeline from "../../../lib/ReactViews/BottomDock/Timeline/Timeline";
import { withThemeContext } from "../withContext";

function timeVaryingItem(
  terria: Terria,
  id: string,
  startTime: string,
  stopTime: string,
  currentTime: string
) {
  const item = new WebMapServiceCatalogItem(id, terria);
  terria.addModel(item);
  item.setTrait("definition", "startTime", startTime);
  item.setTrait("definition", "stopTime", stopTime);
  item.setTrait("definition", "currentTime", currentTime);
  return item;
}

describe("CesiumTimeline", function () {
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria({ baseUrl: "./" });
  });

  afterEach(function () {
    terria.timelineStack.deactivate();
  });

  it("keeps the needle on the timeline when the top item's range changes", function () {
    const recent = timeVaryingItem(
      terria,
      "recent",
      "2026-02-28T00:00:00Z",
      "2026-03-25T00:00:00Z",
      "2026-03-11T00:00:00Z"
    );
    const historic = timeVaryingItem(
      terria,
      "historic",
      "1840-01-01T00:00:00Z",
      "2025-01-01T00:00:00Z",
      "1860-01-01T00:00:00Z"
    );

    runInAction(() => {
      terria.timelineStack.addToTop(recent);
    });

    // Timeline activates the TimelineStack after its CesiumTimeline child has
    // mounted, as in the app.
    const { container } = render(
      withThemeContext(
        <div style={{ width: "800px" }}>
          <Timeline terria={terria} />
        </div>
      )
    );

    // Swap the timeline items the way a story scene change does.
    runInAction(() => {
      terria.timelineStack.removeAll();
      terria.timelineStack.addToTop(historic);
    });
    // The app ticks the clock every frame, which moves the needle.
    terria.timelineClock.tick();

    const needle = container.querySelector(
      ".cesium-timeline-needle"
    ) as HTMLElement;
    const bar = container.querySelector(".cesium-timeline-main") as HTMLElement;
    const needleLeft = parseFloat(needle.style.left);
    expect(needleLeft).toBeGreaterThanOrEqual(0);
    expect(needleLeft).toBeLessThanOrEqual(bar.clientWidth);
  });
});
