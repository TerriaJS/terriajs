import { runInAction } from "mobx";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import SensorObservationServiceCatalogItem from "../../../../lib/Models/Catalog/Ows/SensorObservationServiceCatalogItem";
import Terria from "../../../../lib/Models/Terria";
import SimpleCatalogItem from "../../../Helpers/SimpleCatalogItem";
import TableAutomaticStylesStratum from "../../../../lib/Table/TableAutomaticStylesStratum";
import { isEnum } from "../../../../lib/Models/SelectableDimensions/SelectableDimensions";

const GetFeatureOfInterestResponse = require("raw-loader!../../../../wwwroot/test/sos/GetFeatureOfInterestResponse.xml");
const EmptyGetFeatureOfInterestResponse = require("raw-loader!../../../../wwwroot/test/sos/GetFeatureOfInterestResponse_NoMembers.xml");
const GetObservationResponseDaily = require("raw-loader!../../../../wwwroot/test/sos/GetObservationResponse_Daily.xml");
const GetObservationResponseYearly = require("raw-loader!../../../../wwwroot/test/sos/GetObservationResponse_Yearly.xml");

const regionMapping = JSON.stringify(
  require("../../../../wwwroot/data/regionMapping.json")
);

describe("SensorObservationServiceCatalogItem", function () {
  let item: SensorObservationServiceCatalogItem;

  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.Ajax.addCustomParamParser({
      // @ts-ignore
      test: (xhr) => /^application\/soap\+xml/.test(xhr.contentType()),
      parse: (paramString) => paramString
    });
    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionMapping.json"
    ).andReturn({ responseText: regionMapping });

    item = new SensorObservationServiceCatalogItem("test", new Terria());
    item.setTrait(CommonStrata.user, "url", "https://sos.example.com");
    const proc1 = item.addObject(CommonStrata.user, "procedures", "proc1");
    proc1?.setTrait(CommonStrata.user, "identifier", "Daily Mean");
    proc1?.setTrait(CommonStrata.user, "title", "Daily Mean");
    const proc2 = item.addObject(CommonStrata.user, "procedures", "proc2");
    proc2?.setTrait(CommonStrata.user, "identifier", "Yearly Mean");
    proc2?.setTrait(CommonStrata.user, "title", "Yearly Mean");
    const prop1 = item.addObject(
      CommonStrata.user,
      "observableProperties",
      "prop1"
    );
    prop1?.setTrait(CommonStrata.user, "identifier", "Storage Level");
    prop1?.setTrait(CommonStrata.user, "title", "Storage Level");
    prop1?.setTrait(CommonStrata.user, "units", "mm");
    const prop2 = item.addObject(
      CommonStrata.user,
      "observableProperties",
      "prop2"
    );
    prop2?.setTrait(CommonStrata.user, "identifier", "Ph");
    prop2?.setTrait(CommonStrata.user, "title", "Ph");
    item.setTrait(CommonStrata.user, "proceduresName", "Frequency");
    item.setTrait(
      CommonStrata.user,
      "observablePropertiesName",
      "Observation Type"
    );
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  describe("when constructed", function () {
    it("correctly sets the sourceReference", function () {
      const terria = new Terria();
      const sourceItem = new SimpleCatalogItem(undefined, terria);
      const sosItem = new SensorObservationServiceCatalogItem(
        undefined,
        terria,
        sourceItem
      );
      expect(sosItem.sourceReference).toBe(sourceItem);
    });

    it("correctly initializes the automatic stratum", function () {
      const terria = new Terria();
      const sourceItem = new SimpleCatalogItem(undefined, terria);
      const sosItem = new SensorObservationServiceCatalogItem(
        undefined,
        terria,
        sourceItem
      );
      expect(
        sosItem.strata.get(TableAutomaticStylesStratum.stratumName)
      ).toBeDefined();
    });
  });

  describe("features table", function () {
    beforeEach(function () {
      jasmine.Ajax.stubRequest(
        "https://sos.example.com/",
        /\<sos:GetFeatureOfInterest/
      ).andReturn({ responseText: GetFeatureOfInterestResponse });
    });

    describe("when loading", function () {
      it("makes a GetFeatureOfInterest request", async function () {
        await item.loadMapItems();
        const req = jasmine.Ajax.requests.filter("https://sos.example.com/")[0];
        expect(req.url).toBe("https://sos.example.com/");
        expect(req.method).toBe("POST");
        expect(req.data()).toContain("sos:GetFeatureOfInterest");
        expect(req.data()).toContain("/foiRetrieval/");
        expect(req.data()).toContain(
          "<sos:observedProperty>Storage Level</sos:observedProperty>"
        );
        expect(req.data()).toContain(
          "<sos:observedProperty>Ph</sos:observedProperty>"
        );
        expect(req.data()).toContain(
          "<sos:procedure>Daily Mean</sos:procedure>"
        );
        expect(req.data()).toContain(
          "<sos:procedure>Yearly Mean</sos:procedure>"
        );
      });

      describe("when `filterByProcedures` is false", function () {
        it("should not add any procedures to the request", async function () {
          item.setTrait(CommonStrata.user, "filterByProcedures", false);
          await runInAction(() => item.loadMapItems());
          const req = jasmine.Ajax.requests.mostRecent();
          expect(req.data()).not.toContain("<sos:procedure>");
        });
      });

      it("throws an error if features is empty", async function () {
        jasmine.Ajax.stubRequest(
          "https://sos.example.com/",
          /\<sos:GetFeatureOfInterest/
        ).andReturn({ responseText: EmptyGetFeatureOfInterestResponse });
        let ex = (await item.loadMapItems()).error;
        expect(ex).toBeDefined();
      });
    });

    describe("when loaded", function () {
      it("defines all feature columns", async function () {
        await item.loadMapItems();
        expect(item.tableColumns.map((c) => c.name)).toEqual([
          "identifier",
          "lat",
          "lon",
          "name",
          "id",
          "type",
          "chart"
        ]);
      });

      it("populates the column values correctly", async function () {
        await item.loadMapItems();
        const values: any = {
          identifier: [
            "http://sos.example.com/stations/1",
            "http://sos.example.com/stations/2",
            "http://sos.example.com/stations/3"
          ],
          lat: ["-36.0", "-32.0", "-34.0"],
          lon: ["139.0", "126.0", "132.0"],
          name: ["Feature 1", "Feature 2", "Feature 3"],
          id: ["Ki.FM.1", "Ki.FM.2", "Ki.FM.3"],
          type: [
            "http://www.opengis.net/def/samplingFeatureType/OGC-OM/2.0/SF_SamplingPoint",
            "http://www.opengis.net/def/samplingFeatureType/OGC-OM/2.0/SF_SamplingPoint",
            "http://www.opengis.net/def/samplingFeatureType/OGC-OM/2.0/SF_SamplingPoint"
          ]
        };
        item.tableColumns
          .slice(0, -1)
          .forEach((col) => expect(col.values).toEqual(values[col.name]));
        // just test that the chart columns have chart component defined
        item.tableColumns
          .slice(-1)[0]
          .values.forEach((value) => expect(value).toContain("<sos-chart "));
      });

      describe("with a station id whiteliest", function () {
        it("should only have points for the white listed stations", async function () {
          item.setTrait(CommonStrata.user, "stationIdWhitelist", [
            "http://sos.example.com/stations/1"
          ]);
          await item.loadMapItems();
          const col = item.findColumnByName("identifier");
          expect(col).toBeDefined();
          expect(col?.values).toEqual(["http://sos.example.com/stations/1"]);
        });
      });

      describe("with a station id blacklist", function () {
        it("should not have points for the black listed stations", async function () {
          item.setTrait(CommonStrata.user, "stationIdBlacklist", [
            "http://sos.example.com/stations/1"
          ]);
          await item.loadMapItems();
          const col = item.findColumnByName("identifier");
          expect(col).toBeDefined();
          expect(col?.values).not.toContain(
            "http://sos.example.com/stations/1"
          );
        });
      });

      it("sets the style selectors correctly", async function () {
        await item.loadMapItems();
        expect(item.selectableDimensions.map((s) => s.name)).toEqual([
          "Frequency",
          "Observation Type"
        ]);
      });

      it("shows all options for the procedure selector", async function () {
        await item.loadMapItems();
        const procedureSelector = item.selectableDimensions.find(
          (s) => s.name === "Frequency"
        );
        expect(procedureSelector && isEnum(procedureSelector)).toBeTruthy();

        if (!procedureSelector || !isEnum(procedureSelector))
          throw "Invalid procedureSelector";

        if (procedureSelector) {
          expect(procedureSelector.options?.length).toEqual(4);
        }
      });
    });
  });

  describe("observations table", function () {
    beforeEach(function () {
      jasmine.Ajax.stubRequest(
        "https://sos.example.com/",
        /\<sos:GetObservation[\s\S]*Yearly/
      ).andReturn({ responseText: GetObservationResponseYearly });
      jasmine.Ajax.stubRequest(
        "https://sos.example.com/",
        /\<sos:GetObservation[\s\S]*Daily/
      ).andReturn({ responseText: GetObservationResponseDaily });
      item.setTrait(CommonStrata.user, "showAsChart", true);
      item.setTrait(
        CommonStrata.user,
        "chartFeatureOfInterestIdentifier",
        "feature1"
      );
      item.setTrait(CommonStrata.user, "startDate", "2020-01-26T03:56:15.025Z");
      item.setTrait(CommonStrata.user, "endDate", "2020-03-26T03:56:15.025Z");
    });

    describe("when loading", function () {
      it("makes a GetObservation request", async function () {
        await runInAction(() => item.loadMapItems());
        const req = jasmine.Ajax.requests.mostRecent();
        expect(req.url).toBe("https://sos.example.com/");
        expect(req.method).toBe("POST");
        expect(req.data()).toContain("sos:GetObservation");
        expect(req.data()).toContain("/core/");
        expect(req.data()).toContain(
          "<sos:observedProperty>Storage Level</sos:observedProperty>"
        );
        expect(req.data()).toContain(
          "<sos:featureOfInterest>feature1</sos:featureOfInterest>"
        );
        expect(req.data()).toContain(
          "<sos:featureOfInterest>feature1</sos:featureOfInterest>"
        );
        expect(req.data()).toContain(
          "<gml:beginPosition>2020-01-26T03:56:15.025Z</gml:beginPosition>"
        );
        expect(req.data()).toContain(
          "<gml:endPosition>2020-03-26T03:56:15.025Z</gml:endPosition>"
        );
      });

      it("sets the procedure based on active style", async function () {
        item.setTrait(CommonStrata.user, "activeStyle", "Daily Mean");

        await item.loadMapItems();

        let req = jasmine.Ajax.requests.mostRecent();

        expect(req.data()).toContain(
          "<sos:procedure>Daily Mean</sos:procedure>"
        );

        item.setTrait(CommonStrata.user, "activeStyle", "Yearly Mean");

        // Shouldn't have to force this...
        await item.loadMapItems(true);

        req = jasmine.Ajax.requests.mostRecent();
        expect(req.data()).toContain(
          "<sos:procedure>Yearly Mean</sos:procedure>"
        );
      });
    });

    describe("when loaded", function () {
      beforeEach(async function () {
        await runInAction(() => item.loadMapItems());
      });

      it("defines all feature columns", function () {
        expect(item.tableColumns.map((c) => c.name)).toEqual([
          "date",
          "values",
          "observations",
          "identifiers",
          "Frequency",
          "Observation Type"
        ]);
      });

      it("sets populates the column values correctly", function () {
        const dates = [
          "2016-08-09T02:00:00.000+10:00",
          "2016-08-10T02:00:00.000+10:00",
          "2016-08-11T02:00:00.000+10:00",
          "2016-08-09T02:00:00.000+10:00",
          "2016-08-10T02:00:00.000+10:00",
          "2016-08-11T02:00:00.000+10:00",
          "2016-08-07T00:00:00.000+10:00",
          "2016-08-08T00:00:00.000+10:00",
          "2016-08-09T00:00:00.000+10:00",
          "2016-08-10T00:00:00.000+10:00",
          "2016-08-11T00:00:00.000+10:00"
        ];
        const values = [
          "",
          "29.425",
          "23.123",
          "4.575",
          "2.991",
          "",
          "3.066",
          "2.981",
          "10.136",
          "10.088",
          ""
        ];
        const cols = item.tableColumns;
        expect(cols[0].values).toEqual(dates);
        expect(cols[1].values).toEqual(values);
      });
    });
  });
});
