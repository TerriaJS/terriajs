import { runInAction, when } from "mobx";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import DefaultTimelineModel from "../../lib/Models/DefaultTimelineModel";
import Terria from "../../lib/Models/Terria";

describe("TimelineStack", function () {
  let terria: Terria;
  let wms: WebMapServiceCatalogItem;

  beforeEach(async function () {
    terria = new Terria({
      baseUrl: "./"
    });

    wms = new WebMapServiceCatalogItem("test", terria);
    terria.addModel(wms);
    wms.setTrait("definition", "url", "test/WMS/period_datetimes.xml");
    await wms.loadMapItems();
    terria.timelineStack.addToTop(wms);
    terria.timelineStack.activate();
  });

  afterEach(function () {
    terria.timelineStack.deactivate();
  });

  it(" - is populated with items", function () {
    expect(terria.timelineStack.items.length).toBe(1);
  });

  it(" - contains method works", function () {
    expect(terria.timelineStack.contains(wms)).toBe(true);
  });

  it(" - gets the right item from the top", async function () {
    expect(terria.timelineStack.top).toBe(wms);

    const wms2 = new WebMapServiceCatalogItem("test2", terria);
    terria.addModel(wms2);
    wms2.setTrait("definition", "url", "test/WMS/comma_sep_datetimes.xml");
    await wms2.loadMapItems();
    terria.timelineStack.addToTop(wms2);

    expect(terria.timelineStack.top).toBe(wms2);

    terria.timelineStack.remove(wms2);
    expect(terria.timelineStack.top).toBe(wms);
  });

  it("skips a layer with a single instant so the timeline always gets a range", function () {
    // A WMTS/WMS layer whose only time value is e.g. `2019-04-18/2019-04-18/P1429D`
    // has startTime === stopTime. Cesium's Timeline.zoomTo throws on that, so
    // such a layer must never become `top` or drive the clock range.
    const single = new WebMapServiceCatalogItem("single", terria);
    terria.addModel(single);
    single.setTrait("definition", "startTime", "2019-04-18");
    single.setTrait("definition", "stopTime", "2019-04-18");
    terria.timelineStack.addToTop(single);

    expect(terria.timelineStack.top).toBe(wms);
    const clock = terria.timelineStack.clock;
    expect(JulianDate.lessThan(clock.startTime, clock.stopTime)).toBe(true);
  });

  it("automatically syncs the clock with the top item", async function () {
    const wms2 = new WebMapServiceCatalogItem("test2", terria);
    terria.addModel(wms2);
    wms2.setTrait("definition", "url", "test/WMS/comma_sep_datetimes.xml");
    wms2.setTrait("user", "isPaused", false);
    await wms2.loadMapItems();
    terria.timelineStack.addToTop(wms2);

    terria.timelineStack.clock.shouldAnimate = true;
    wms2.setTrait("user", "isPaused", true);
    await when(() => terria.timelineStack.top?.isPaused === true);
    expect(terria.timelineStack.clock.shouldAnimate).toBe(false);
  });

  describe("toggling 'always show timeline'", function () {
    const DEFAULT_TIMELINE_MODEL_ID = "defaultTimeline";

    it("adds the default timeline model to terria when enabled", function () {
      expect(terria.timelineStack.alwaysShowingTimeline).toBe(false);
      expect(
        terria.getModelById(DefaultTimelineModel, DEFAULT_TIMELINE_MODEL_ID)
      ).toBeUndefined();
      runInAction(() => {
        terria.timelineStack.setAlwaysShowTimeline(true);
      });
      expect(
        terria.getModelById(DefaultTimelineModel, DEFAULT_TIMELINE_MODEL_ID)
      ).toBe(terria.timelineStack.defaultTimeVarying as any);
    });

    it("removes the default timeline model from terria when disabled", function () {
      runInAction(() => {
        terria.timelineStack.setAlwaysShowTimeline(true);
      });
      expect(
        terria.getModelById(DefaultTimelineModel, DEFAULT_TIMELINE_MODEL_ID)
      ).toBe(terria.timelineStack.defaultTimeVarying as any);
      runInAction(() => {
        terria.timelineStack.setAlwaysShowTimeline(false);
      });
      expect(
        terria.getModelById(DefaultTimelineModel, DEFAULT_TIMELINE_MODEL_ID)
      ).toBe(undefined);
    });
  });
});
