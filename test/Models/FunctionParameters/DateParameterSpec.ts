import Clock from "terriajs-cesium/Source/Core/Clock";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import WebProcessingServiceCatalogFunction from "../../../lib/Models/Catalog/Ows/WebProcessingServiceCatalogFunction";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";
import DateParameter from "../../../lib/Models/FunctionParameters/DateParameter";
import Terria from "../../../lib/Models/Terria";

describe("DateParameter", function () {
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
      const param = new DateParameter(catalogFunction, {
        id: "date",
        clock
      });
      expect(param.value).toBeUndefined();
    });

    describe("when the parameter is marked as required", function () {
      it("defaults to current clock time", function () {
        const param = new DateParameter(catalogFunction, {
          id: "date",
          clock,
          isRequired: true
        });
        expect(param.value).toBeDefined();
        expect(param.value).toBe("2024-01-01");
      });
    });
  });

  describe("set value", function () {
    let param: DateParameter;

    beforeEach(function () {
      param = new DateParameter(catalogFunction, {
        id: "date",
        clock
      });
    });

    it("sets the value correctly", function () {
      param.setValue(CommonStrata.user, "2024-12-01");
      expect(param.value).toBe("2024-12-01");
    });

    it("clears the value if the new value is not a valid date time", function () {
      param.setValue(CommonStrata.user, "2024-12-01");
      expect(param.value).toBe("2024-12-01");
      param.setValue(CommonStrata.user, "2024-42-42");
      expect(param.value).toBeUndefined();
    });
  });
});
