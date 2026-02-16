import { render, screen, within } from "@testing-library/react";
import i18next from "i18next";
import { runInAction } from "mobx";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import Terria from "../../lib/Models/Terria";
import { formatDateTime } from "../../lib/ReactViews/BottomDock/Timeline/DateFormats";
import Timeline from "../../lib/ReactViews/BottomDock/Timeline/Timeline";
import { withThemeContext } from "./withContext";

describe("Timeline", function () {
  describe("dateTime format", function () {
    let terria: Terria;
    let wmsItem: WebMapServiceCatalogItem;

    beforeAll(async () => {
      await i18next.changeLanguage("en");
    });

    afterAll(async () => {
      await i18next.changeLanguage("cimode");
    });

    beforeEach(async function () {
      terria = new Terria({
        baseUrl: "./"
      });

      wmsItem = new WebMapServiceCatalogItem("test-wms", terria);
      terria.addModel(wmsItem);
      wmsItem.setTrait("definition", "url", "test/WMS/period_datetimes.xml");
      await wmsItem.loadMapItems();
    });

    afterEach(function () {
      terria.timelineStack.deactivate();
    });

    it("dateFormat should be used if provided", async function () {
      runInAction(() => {
        wmsItem.setTrait(CommonStrata.definition, "currentTime", "2016-01-03");
        wmsItem.setTrait(CommonStrata.definition, "dateFormat", "mmm");
        terria.timelineStack.addToTop(wmsItem);
        terria.timelineStack.activate();
      });

      expect(terria.timelineStack.top).toBe(wmsItem);

      const { container } = render(
        withThemeContext(<Timeline terria={terria} />)
      );
      screen.debug(container);
      expect(within(container).getByText("Jan")).toBeInTheDocument();
    });

    it("default format should be used if dateFormat is not provided", function () {
      const isoTime = "2016-01-01T00:00:00Z";

      runInAction(() => {
        wmsItem.setTrait(CommonStrata.definition, "currentTime", isoTime);
        terria.timelineStack.addToTop(wmsItem);
        terria.timelineStack.activate();
      });

      render(withThemeContext(<Timeline terria={terria} />));

      const expectedDate = JulianDate.toDate(JulianDate.fromIso8601(isoTime));
      const expectedText = formatDateTime(expectedDate);
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });
  });
});
