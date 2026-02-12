import { runInAction, when } from "mobx";
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
