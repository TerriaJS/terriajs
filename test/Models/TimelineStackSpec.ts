import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import Terria from "../../lib/Models/Terria";
import { when } from "mobx";

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

  it(" - is populated with items", async function () {
    expect(terria.timelineStack.items.length).toBe(1);
  });

  it(" - contains method works", async function () {
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
});
