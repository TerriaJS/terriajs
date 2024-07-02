import Clock from "terriajs-cesium/Source/Core/Clock";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import WebProcessingServiceCatalogFunction from "../../../lib/Models/Catalog/Ows/WebProcessingServiceCatalogFunction";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";
import DateTimeParameter from "../../../lib/Models/FunctionParameters/DateTimeParameter";
import Terria from "../../../lib/Models/Terria";

describe("DateTimeParameter", function () {
  let catalogFunction: WebProcessingServiceCatalogFunction;
  let clock: Clock;

  beforeEach(function () {
    const terria = new Terria();
    catalogFunction = new WebProcessingServiceCatalogFunction("test", terria);
    clock = terria.timelineClock;
    clock.currentTime = JulianDate.fromDate(new Date("2024-01-01T00:00"));
  });

  describe("its value", function () {
    it("defaults to undefined", function () {
      const param = new DateTimeParameter(catalogFunction, {
        id: "datetime",
        clock
      });
      expect(param.value).toBeUndefined();
    });

    describe("when the parameter is marked as required", function () {
      it("defaults to current clock time", function () {
        const param = new DateTimeParameter(catalogFunction, {
          id: "datetime",
          clock,
          isRequired: true
        });
        expect(param.value).toBeDefined();
        expect(param.value).toBe("2024-01-01T00:00");
      });
    });
  });

  describe("set value", function () {
    let param: DateTimeParameter;

    beforeEach(function () {
      param = new DateTimeParameter(catalogFunction, {
        id: "datetime",
        clock
      });
    });

    it("sets the value correctly", function () {
      param.setValue(CommonStrata.user, "2024-12-01T00:00");
      expect(param.value).toBe("2024-12-01T00:00");
    });

    it("clears the value if the new value is not a valid date time", function () {
      param.setValue(CommonStrata.user, "2024-12-01T00:00");
      expect(param.value).toBe("2024-12-01T00:00");
      param.setValue(CommonStrata.user, "2024-42-42T00:00");
      expect(param.value).toBeUndefined();
    });
  });
});
